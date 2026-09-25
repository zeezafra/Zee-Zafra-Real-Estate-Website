const express = require("express");
const streamifier = require("streamifier");
const requireAdmin = require("../middleware/requireAdmin");
const upload = require("../middleware/upload");
const cloudinary = require("../lib/cloudinary");
const prisma = require("../lib/prisma");

const router = express.Router();

// Keep in sync with the enums in prisma/schema.prisma.
const PROPERTY_TYPES = ["HOUSE_AND_LOT", "CONDO", "TOWNHOUSE", "COMMERCIAL", "VACANT_LOT"];
const LISTING_TYPES = ["FOR_SALE", "FOR_RENT"];
const PROPERTY_STATUSES = ["AVAILABLE", "SOLD", "RESERVED"];

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

  return { data, errors };
}

// POST /api/admin/properties
router.post("/properties", requireAdmin, async (req, res) => {
  const { data, errors } = validatePropertyPayload(req.body || {});
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join("; ") });
  }

  try {
    const property = await prisma.property.create({ data });
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
    const property = await prisma.property.update({
      where: { id: req.params.id },
      data,
    });
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
