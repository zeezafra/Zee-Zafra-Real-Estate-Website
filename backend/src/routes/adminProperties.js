const express = require("express");
const streamifier = require("streamifier");
const requireAdmin = require("../middleware/requireAdmin");
const upload = require("../middleware/upload");
const cloudinary = require("../lib/cloudinary");
const prisma = require("../lib/prisma");
const { notifyMatchingSubscribers } = require("../lib/listingAlerts");

const router = express.Router();

// Keep in sync with the enums in prisma/schema.prisma.
const PROPERTY_TYPES = ["HOUSE_AND_LOT", "CONDO", "TOWNHOUSE", "COMMERCIAL", "VACANT_LOT"];
const LISTING_TYPES = ["FOR_SALE", "FOR_RENT"];
const PROPERTY_STATUSES = ["AVAILABLE", "SOLD", "RESERVED", "DRAFT"];
const BULK_ACTIONS = ["MARK_AVAILABLE", "MARK_SOLD", "MARK_RESERVED", "FEATURE", "UNFEATURE"];
const ID_RE = /^[A-Za-z0-9_-]{5,40}$/;

function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "zee-zafra-properties" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// POST /api/admin/upload
// Accepts up to 10 images under the "images" field, uploads each to
// Cloudinary, and returns the resulting URLs. The frontend calls this
// before create/edit, then sends the URLs as part of the property payload —
// keeps the CRUD routes below as plain JSON, no multipart parsing there.
router.post("/upload", requireAdmin, upload.array("images", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images were provided" });
    }

    const urls = await Promise.all(
      req.files.map((file) => uploadBufferToCloudinary(file.buffer))
    );

    res.json({ urls });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Image upload failed" });
  }
});

// Shared validator for POST (full payload required) and PATCH (partial —
// only validates fields that were actually sent). Returns the sanitized
// data to persist plus a list of human-readable errors.
function validatePropertyPayload(body, { partial = false } = {}) {
  const errors = [];
  const data = {};
  const provided = (field) => body[field] !== undefined;
  const need = (field) => !partial || provided(field);

  if (need("title")) {
    if (!body.title || typeof body.title !== "string") {
      errors.push("title is required");
    } else {
      data.title = body.title;
    }
  }

  if (need("type")) {
    if (!PROPERTY_TYPES.includes(body.type)) {
      errors.push(`type must be one of ${PROPERTY_TYPES.join(", ")}`);
    } else {
      data.type = body.type;
    }
  }

  if (need("listingType")) {
    if (!LISTING_TYPES.includes(body.listingType)) {
      errors.push(`listingType must be one of ${LISTING_TYPES.join(", ")}`);
    } else {
      data.listingType = body.listingType;
    }
  }

  if (provided("status")) {
    if (!PROPERTY_STATUSES.includes(body.status)) {
      errors.push(`status must be one of ${PROPERTY_STATUSES.join(", ")}`);
    } else {
      data.status = body.status;
    }
  }

  if (need("price")) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      errors.push("price must be a non-negative number");
    } else {
      data.price = Math.round(price);
    }
  }

  if (provided("rentPeriod")) {
    data.rentPeriod = body.rentPeriod || null;
  }

  // Phase 12. Same "provided, nullable" shape as rentPeriod above — the
  // admin form sends null when the "price reduced" checkbox is off. Not
  // required to be greater than `price`: a slightly-off entry shouldn't
  // block saving the rest of the listing, it just won't trigger the
  // "Price Reduced" badge on the frontend (that check lives there, not
  // here — see PropertyCard.tsx / the detail page).
  if (provided("originalPrice")) {
    if (body.originalPrice === null || body.originalPrice === "") {
      data.originalPrice = null;
    } else {
      const originalPrice = Number(body.originalPrice);
      if (!Number.isFinite(originalPrice) || originalPrice < 0) {
        errors.push("originalPrice must be a non-negative number or null");
      } else {
        data.originalPrice = Math.round(originalPrice);
      }
    }
  }

  if (need("location")) {
    if (!body.location || typeof body.location !== "string") {
      errors.push("location is required");
    } else {
      data.location = body.location;
    }
  }

  for (const field of ["beds", "baths", "carSpaces"]) {
    if (provided(field)) {
      data[field] =
        body[field] === null || body[field] === "" ? null : parseInt(body[field], 10);
    }
  }

  if (need("sqm")) {
    const sqm = Number(body.sqm);
    if (!Number.isFinite(sqm) || sqm <= 0) {
      errors.push("sqm must be a positive number");
    } else {
      data.sqm = sqm;
    }
  }

  if (need("description")) {
    if (!body.description || typeof body.description !== "string") {
      errors.push("description is required");
    } else {
      data.description = body.description;
    }
  }

  if (provided("images")) {
    if (!Array.isArray(body.images) || !body.images.every((url) => typeof url === "string")) {
      errors.push("images must be an array of URLs");
    } else {
      data.images = body.images;
    }
  }

  if (provided("featured")) {
    data.featured = Boolean(body.featured);
  }

  // Phase 25. latitude/longitude travel as a pair: both set, or both
  // cleared (null/""). A lone value would put a pin at "latitude, 0" in
  // the Gulf of Guinea, which is worse than no map at all.
  if (provided("latitude") || provided("longitude")) {
    const isBlank = (v) => v === null || v === undefined || v === "";
    if (isBlank(body.latitude) && isBlank(body.longitude)) {
      data.latitude = null;
      data.longitude = null;
    } else if (isBlank(body.latitude) || isBlank(body.longitude)) {
      errors.push("latitude and longitude must be provided together");
    } else {
      const lat = Number(body.latitude);
      const lng = Number(body.longitude);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        errors.push("latitude must be a number between -90 and 90");
      } else if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        errors.push("longitude must be a number between -180 and 180");
      } else {
        data.latitude = lat;
        data.longitude = lng;
      }
    }
  }

  // Phase 25. Only http(s) URLs are accepted — the value ends up in an
  // iframe src / anchor href on the public site, so "javascript:" and
  // similar schemes are rejected here rather than trusted downstream.
  if (provided("videoUrl")) {
    if (body.videoUrl === null || body.videoUrl === "") {
      data.videoUrl = null;
    } else if (typeof body.videoUrl !== "string") {
      errors.push("videoUrl must be a URL string");
    } else {
      let parsed = null;
      try {
        parsed = new URL(body.videoUrl.trim());
      } catch (_) {
        parsed = null;
      }
      if (!parsed || !["http:", "https:"].includes(parsed.protocol)) {
        errors.push("videoUrl must be a valid http(s) URL");
      } else {
        data.videoUrl = parsed.toString();
      }
    }
  }

  // Phase 27. Only meaningful while status is DRAFT (see schema comment);
  // stored regardless of the status in the same request so an admin can
  // set a publish date before flipping to Draft, or clear it without
  // touching status. null/"" clears it; anything else must parse as a
  // real, non-past-by-more-than-a-minute date — a schedule "5 minutes
  // ago" is almost always a timezone mistake, not an intentional
  // immediate-publish request (the admin can just pick AVAILABLE for that).
  if (provided("publishAt")) {
    if (body.publishAt === null || body.publishAt === "") {
      data.publishAt = null;
    } else {
      const date = new Date(body.publishAt);
      if (Number.isNaN(date.getTime())) {
        errors.push("publishAt must be a valid date/time");
      } else if (date.getTime() < Date.now() - 60000) {
        errors.push("publishAt must be in the future");
      } else {
        data.publishAt = date;
      }
    }
  }

  // Trust & polish. Explicit sold date (backdating deals closed before the
  // site existed). Accepts "YYYY-MM-DD" or a full ISO string; null/""
  // clears it. Future dates are rejected — a sale that hasn't happened
  // yet isn't a track record.
  if (provided("soldAt")) {
    if (body.soldAt === null || body.soldAt === "") {
      data.soldAt = null;
    } else {
      const date = new Date(body.soldAt);
      if (Number.isNaN(date.getTime())) {
        errors.push("soldAt must be a valid date");
      } else if (date.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
        errors.push("soldAt can't be in the future");
      } else {
        data.soldAt = date;
      }
    }
  }

  // A manual, non-Draft status change clears any leftover schedule so the
  // admin form doesn't keep showing a stale "Scheduled for …" date for a
  // listing that's already live. Only when the caller didn't also send an
  // explicit publishAt in the same request (so a POST create carrying both
  // status and publishAt isn't fought with itself).
  if (provided("status") && data.status && data.status !== "DRAFT" && !provided("publishAt")) {
    data.publishAt = null;
  }

  return { data, errors };
}

// GET /api/admin/properties
// Phase 27. Authenticated counterpart to the public GET /api/properties —
// returns every status including DRAFT, which the public route (no auth
// at all) now hard-excludes. The admin dashboard table and the edit page
// both need this rather than the public route, or a draft could never be
// seen or edited after being created.
router.get("/properties", requireAdmin, async (req, res) => {
  try {
    const properties = await prisma.property.findMany({ orderBy: { createdAt: "desc" } });
    res.json(properties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

// GET /api/admin/properties/:id — same reasoning as the list route above.
// Unlike the public GET /api/properties/:id, this never increments
// viewCount — an admin opening the edit page isn't a "view".
router.get("/properties/:id", requireAdmin, async (req, res) => {
  try {
    const property = await prisma.property.findUnique({ where: { id: req.params.id } });
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }
    res.json(property);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch property" });
  }
});

// PATCH /api/admin/properties/bulk
// Phase 27. { ids: string[], action: "MARK_AVAILABLE" | "MARK_SOLD" |
// "MARK_RESERVED" | "FEATURE" | "UNFEATURE" }. One action, many rows — for
// anything that needs a per-row value (editing a price, say) the admin
// still uses the single-property PATCH above; this only covers the flat
// actions the properties table's row-selection toolbar offers.
router.patch("/properties/bulk", requireAdmin, async (req, res) => {
  const body = req.body || {};
  const ids = Array.isArray(body.ids) ? body.ids.filter((id) => typeof id === "string" && ID_RE.test(id)) : [];
  const action = body.action;

  if (ids.length === 0) {
    return res.status(400).json({ error: "ids must be a non-empty array" });
  }
  if (ids.length > 200) {
    return res.status(400).json({ error: "Too many ids in one request (max 200)" });
  }
  if (!BULK_ACTIONS.includes(action)) {
    return res.status(400).json({ error: `action must be one of ${BULK_ACTIONS.join(", ")}` });
  }

  const data =
    action === "MARK_AVAILABLE"
      ? { status: "AVAILABLE", publishAt: null, soldAt: null }
      : action === "MARK_SOLD"
        ? { status: "SOLD", publishAt: null }
        : action === "MARK_RESERVED"
          ? { status: "RESERVED", publishAt: null, soldAt: null }
          : action === "FEATURE"
            ? { featured: true }
            : { featured: false };

  try {
    const result = await prisma.property.updateMany({ where: { id: { in: ids } }, data });

    // Trust & polish: stamp the sold date only where there isn't one yet, so
    // re-running MARK_SOLD never overwrites a hand-entered closing date.
    if (action === "MARK_SOLD") {
      await prisma.property.updateMany({
        where: { id: { in: ids }, soldAt: null },
        data: { soldAt: new Date() },
      });
    }

    // MARK_AVAILABLE can newly satisfy saved-search alerts — notify for
    // each (notifyMatchingSubscribers already no-ops anything that isn't
    // freshly AVAILABLE or has already been announced, via alertsSentAt).
    if (action === "MARK_AVAILABLE") {
      const updated = await prisma.property.findMany({ where: { id: { in: ids } } });
      updated.forEach((p) => notifyMatchingSubscribers(p));
    }

    res.json({ updated: result.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Bulk update failed" });
  }
});

// POST /api/admin/properties/:id/duplicate
// Phase 27. Clones a listing as a starting point for a similar one (e.g.
// another unit in the same building) — the new row is always created as
// DRAFT regardless of the source's status, so a duplicate never goes live
// (or emails alert subscribers) until the admin has actually reviewed and
// edited it. refNo, id, viewCount, favoriteCount, alertsSentAt all reset.
router.post("/properties/:id/duplicate", requireAdmin, async (req, res) => {
  try {
    const source = await prisma.property.findUnique({ where: { id: req.params.id } });
    if (!source) {
      return res.status(404).json({ error: "Property not found" });
    }

    const {
      id, refNo, createdAt, updatedAt, viewCount, favoriteCount, alertsSentAt, soldAt,
      ...rest
    } = source;

    const duplicate = await prisma.property.create({
      data: { ...rest, title: `${source.title} (Copy)`, status: "DRAFT", featured: false, publishAt: null },
    });

    res.status(201).json(duplicate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to duplicate property" });
  }
});

// POST /api/admin/properties
router.post("/properties", requireAdmin, async (req, res) => {
  const { data, errors } = validatePropertyPayload(req.body || {});
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join("; ") });
  }

  try {
    // Trust & polish: a listing created directly as SOLD (logging a past
    // deal) with no explicit date gets today's date.
    if (data.status === "SOLD" && data.soldAt === undefined) data.soldAt = new Date();

    const property = await prisma.property.create({ data });
    // Phase 26: fire-and-forget email alerts to matching subscribers.
    notifyMatchingSubscribers(property);
    res.status(201).json(property);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create property" });
  }
});

// PATCH /api/admin/properties/:id
router.patch("/properties/:id", requireAdmin, async (req, res) => {
  const { data, errors } = validatePropertyPayload(req.body || {}, { partial: true });
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join("; ") });
  }

  try {
    // Trust & polish: keep soldAt in step with status unless the admin set
    // it explicitly in this same request.
    if (data.status && data.soldAt === undefined) {
      if (data.status === "SOLD") {
        const current = await prisma.property.findUnique({
          where: { id: req.params.id },
          select: { soldAt: true },
        });
        if (current && !current.soldAt) data.soldAt = new Date();
      } else {
        data.soldAt = null;
      }
    }

    const property = await prisma.property.update({
      where: { id: req.params.id },
      data,
    });
    // Phase 26: no-op unless this is the first time it's AVAILABLE.
    notifyMatchingSubscribers(property);
    res.json(property);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Property not found" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to update property" });
  }
});

// DELETE /api/admin/properties/:id
router.delete("/properties/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.property.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Property not found" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to delete property" });
  }
});

module.exports = router;
