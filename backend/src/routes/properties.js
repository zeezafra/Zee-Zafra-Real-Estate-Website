const express = require("express");
const prisma = require("../lib/prisma");
const favoriteRateLimit = require("../middleware/favoriteRateLimit");
const flyerRateLimit = require("../middleware/flyerRateLimit");
const { buildFlyerPdf, flyerFileName } = require("../lib/flyer");

const router = express.Router();

const SORT_OPTIONS = {
  newest: { createdAt: "desc" },
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
};

// Parses a query-string integer, returning null for anything that isn't a
// usable positive whole number (missing, empty, "abc", "-2"). Added in
// UI/UX Phase 3 for the new minBeds/minBaths params so a junk value is
// ignored rather than reaching Prisma as NaN.
function toPositiveInt(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// GET /api/properties
// Supports ?type= ?listingType= ?location= ?minPrice= ?maxPrice= ?minBeds=
// ?minBaths= ?featured= ?status= ?sort= ?q=
//
// Phase 2 wired up type/listingType/location/minPrice/maxPrice/featured
// ahead of any filtering UI. Phase 8 adds the two pieces that UI needed:
// `sort` (price asc/desc, newest) and `q`, a lightweight title-or-location
// search for the nav search icon — distinct from `location`, which is an
// exact-field filter used by the /properties filter form. Both can be
// combined; `q` and `location` narrow independently (AND), `q` itself
// matches title OR location.
//
// UI/UX Phase 3 adds `minBeds` and `minBaths` — both minimums ("3+ beds"),
// not exact matches, which is how buyers actually think about this. Because
// `beds`/`baths` are nullable (a vacant lot has neither), a `gte` filter
// correctly excludes those rows: SQL comparisons against NULL are never
// true. `status` was already supported here since Phase 2; UI/UX Phase 3 is
// the first thing to surface it to a visitor.
router.get("/", async (req, res) => {
  try {
    const {
      type,
      listingType,
      location,
      minPrice,
      maxPrice,
      minBeds,
      minBaths,
      featured,
      status,
      sort,
      q,
      ids,
    } = req.query;

    const where = {};

    // Phase 26: ?ids=a,b,c — used by /compare so it can fetch specific
    // listings without hitting GET /:id (which bumps viewCount on every
    // call and would inflate the analytics). Capped at 3, same as the UI.
    if (typeof ids === "string" && ids.trim()) {
      where.id = {
        in: ids
          .split(",")
          .map((v) => v.trim())
          .filter((v) => /^[A-Za-z0-9_-]{5,40}$/.test(v))
          .slice(0, 3),
      };
    }

    if (type) where.type = type;
    if (listingType) where.listingType = listingType;
    // Phase 27: DRAFT is never a publicly-selectable status, no matter what
    // the caller passes — this is enforced here, not just by the frontend
    // defaulting to AVAILABLE, since this route has no auth on it at all.
    where.status = status && status !== "DRAFT" ? status : { not: "DRAFT" };
    if (featured !== undefined) where.featured = featured === "true";

    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseInt(minPrice, 10);
      if (maxPrice) where.price.lte = parseInt(maxPrice, 10);
    }

    const beds = toPositiveInt(minBeds);
    if (beds !== null) where.beds = { gte: beds };

    const baths = toPositiveInt(minBaths);
    if (baths !== null) where.baths = { gte: baths };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ];
    }

    const orderBy = SORT_OPTIONS[sort] ?? SORT_OPTIONS.newest;

    const properties = await prisma.property.findMany({
      where,
      orderBy,
    });

    res.json(properties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

// GET /api/properties/:id/flyer.pdf
// Phase 26. One-page shareable PDF (photos, price, ref no, key facts) for
// sending over Messenger/Viber. Rate limited: it fetches images and
// renders a PDF per call. Declared before GET /:id — different path depth,
// but kept adjacent to the other specific routes for readability.
router.get("/:id/flyer.pdf", flyerRateLimit, async (req, res) => {
  try {
    const property = await prisma.property.findUnique({ where: { id: req.params.id } });
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    const pdf = await buildFlyerPdf(property);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${flyerFileName(property)}"`);
    res.setHeader("Cache-Control", "public, max-age=300");
    res.send(pdf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate flyer" });
  }
});

// GET /api/properties/areas
// Phase 15: distinct AVAILABLE locations with a listing count each, for the
// homepage's "Popular Areas" section and the /areas / /areas/[slug]
// neighborhood landing pages. Must be declared before GET /:id below —
// Express would otherwise match "areas" as an :id value on that route
// instead of reaching this one.
//
// Deliberately reads straight off the existing free-text `location` column
// rather than a new taxonomy table (the roadmap explicitly decided a full
// multi-city location taxonomy out of scope) — one row per distinct string
// already on a Property. The frontend derives each area's URL slug from
// `location` itself (see frontend/lib/slug.ts) rather than this endpoint
// inventing one, so there's a single source of truth for the slugify rule.
router.get("/areas", async (req, res) => {
  try {
    const groups = await prisma.property.groupBy({
      by: ["location"],
      where: { status: "AVAILABLE" },
      _count: { _all: true },
    });

    const areas = groups
      .map((g) => ({ location: g.location, count: g._count._all }))
      .sort((a, b) => b.count - a.count || a.location.localeCompare(b.location));

    res.json(areas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch areas" });
  }
});

// GET /api/properties/sold?limit=
// Trust & polish. The "Recently Sold / Rented" track record: every SOLD
// listing (a SOLD FOR_RENT listing is a rented one), most recently closed
// first. Declared before GET /:id so "sold" isn't read as a property id.
// Rows without a soldAt (shouldn't exist after the migration's backfill,
// but an admin can clear it) sort last rather than disappearing.
router.get("/sold", async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 60, 1), 100);
    const properties = await prisma.property.findMany({
      where: { status: "SOLD" },
      orderBy: [{ soldAt: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
      take: limit,
      select: {
        id: true, refNo: true, title: true, type: true, listingType: true, status: true,
        price: true, rentPeriod: true, location: true, beds: true, baths: true,
        carSpaces: true, sqm: true, images: true, soldAt: true, updatedAt: true,
      },
    });
    res.json(properties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch sold properties" });
  }
});

// GET /api/properties/:id
//
// Phase 23 (UI/UX Phase 7). Increments `viewCount` on every fetch of this
// route — the only place a visitor actually lands on a specific listing
// (the grid and homepage cards never call this endpoint per-card). Uses a
// single atomic `update` with `increment` rather than a separate
// findUnique + update pair, so two concurrent requests for the same
// listing can't race and drop a count. Prisma throws P2025 ("record to
// update not found") instead of returning null the way findUnique would,
// so that's what a missing id turns into a 404 here.
router.get("/:id", async (req, res) => {
  try {
    // Phase 27: a DRAFT listing 404s here exactly like a nonexistent id —
    // checked with a read first (rather than a conditional update) so a
    // draft's viewCount is never bumped by a stray/guessed hit either.
    const existing = await prisma.property.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.status === "DRAFT") {
      return res.status(404).json({ error: "Property not found" });
    }

    const property = await prisma.property.update({
      where: { id: req.params.id },
      data: { viewCount: { increment: 1 } },
    });

    res.json(property);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Property not found" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to fetch property" });
  }
});

// POST /api/properties/:id/favorite
// DELETE /api/properties/:id/favorite
//
// Phase 24 (UI/UX Phase 7, most-favorited analytics). Favorites themselves
// are Phase 12's localStorage-only saved-listings list — there's no
// server-side "who favorited what" table — so this is purely a counter the
// frontend's heart button (SaveButton.tsx, via useSavedListings.toggleSaved)
// increments or decrements as it flips the local list, same shape as
// `viewCount` on the GET /:id route above. Both calls are fire-and-forget
// from the client: a failure here never blocks the localStorage toggle
// itself, so these intentionally return a minimal body.
//
// DELETE uses updateMany with `favoriteCount: { gt: 0 }` rather than a
// plain `update` + `decrement`, so a row already at 0 (a double-fired
// unfavorite, or a decrement racing an increment) simply matches nothing
// instead of the count going negative — `update`'s atomic `decrement`
// has no floor of its own.
router.post("/:id/favorite", favoriteRateLimit, async (req, res) => {
  try {
    await prisma.property.update({
      where: { id: req.params.id },
      data: { favoriteCount: { increment: 1 } },
    });
    res.status(204).end();
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Property not found" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to update favorite count" });
  }
});

router.delete("/:id/favorite", favoriteRateLimit, async (req, res) => {
  try {
    await prisma.property.updateMany({
      where: { id: req.params.id, favoriteCount: { gt: 0 } },
      data: { favoriteCount: { decrement: 1 } },
    });
    // No P2025 possible here (updateMany never throws "not found") — a
    // nonexistent id or an already-0 count both just match zero rows,
    // which is the same "nothing to do" outcome either way for this
    // fire-and-forget counter.
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update favorite count" });
  }
});

module.exports = router;
