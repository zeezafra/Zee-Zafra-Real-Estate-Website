const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

const SORT_OPTIONS = {
  newest: { createdAt: "desc" },
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
};

// GET /api/properties
// Supports ?type= ?listingType= ?location= ?minPrice= ?maxPrice= ?featured=
// ?status= ?sort= ?q=
//
// Phase 2 wired up type/listingType/location/minPrice/maxPrice/featured
// ahead of any filtering UI. Phase 8 adds the two pieces that UI needed:
// `sort` (price asc/desc, newest) and `q`, a lightweight title-or-location
// search for the nav search icon — distinct from `location`, which is an
// exact-field filter used by the /properties filter form. Both can be
// combined; `q` and `location` narrow independently (AND), `q` itself
// matches title OR location.
router.get("/", async (req, res) => {
  try {
    const {
      type,
      listingType,
      location,
      minPrice,
      maxPrice,
      featured,
      status,
      sort,
      q,
    } = req.query;

    const where = {};

    if (type) where.type = type;
    if (listingType) where.listingType = listingType;
    if (status) where.status = status;
    if (featured !== undefined) where.featured = featured === "true";

    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseInt(minPrice, 10);
      if (maxPrice) where.price.lte = parseInt(maxPrice, 10);
    }

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

// GET /api/properties/:id
router.get("/:id", async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    res.json(property);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch property" });
  }
});

module.exports = router;
