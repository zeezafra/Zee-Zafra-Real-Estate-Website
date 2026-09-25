const express = require("express");
const requireAdmin = require("../middleware/requireAdmin");
const prisma = require("../lib/prisma");

const router = express.Router();

// Same shared-validator shape as adminProperties.js's
// validatePropertyPayload: one function for POST (full payload required)
// and PATCH (partial — only validates fields actually sent).
function validatePostPayload(body, { partial = false } = {}) {
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

  if (need("slug")) {
    // Keep the check permissive but honest about what /blog/[slug] can
    // actually route on — lowercase letters, numbers, and hyphens, no
    // leading/trailing hyphen. The frontend's admin form suggests one via
    // the same slugify() used for area slugs, but the admin can edit it
    // before saving.
    if (!body.slug || typeof body.slug !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(body.slug)) {
      errors.push("slug must be lowercase letters, numbers, and hyphens only");
    } else {
      data.slug = body.slug;
    }
  }

  if (need("excerpt")) {
    if (!body.excerpt || typeof body.excerpt !== "string") {
      errors.push("excerpt is required");
    } else {
      data.excerpt = body.excerpt;
    }
  }

  if (need("content")) {
    if (!body.content || typeof body.content !== "string") {
      errors.push("content is required");
    } else {
      data.content = body.content;
    }
  }

  if (provided("coverImage")) {
    data.coverImage = body.coverImage || null;
  }

  if (provided("published")) {
    data.published = Boolean(body.published);
  }

  return { data, errors };
}

// GET /api/admin/posts
// Unlike GET /api/posts, no `published` filter — this is the admin table,
// same "show everything, including what the public grid hides" contract
// as GET /api/properties feeding the admin dashboard's PropertiesTable.
router.get("/posts", requireAdmin, async (req, res) => {
  try {
    const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" } });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// POST /api/admin/posts
router.post("/posts", requireAdmin, async (req, res) => {
  const { data, errors } = validatePostPayload(req.body || {});
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join("; ") });
  }

  try {
    const post = await prisma.post.create({ data });
    res.status(201).json(post);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ error: "That slug is already in use" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// PATCH /api/admin/posts/:id
router.patch("/posts/:id", requireAdmin, async (req, res) => {
  const { data, errors } = validatePostPayload(req.body || {}, { partial: true });
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join("; ") });
  }

  try {
    const post = await prisma.post.update({
      where: { id: req.params.id },
      data,
    });
    res.json(post);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Post not found" });
    }
    if (err.code === "P2002") {
      return res.status(400).json({ error: "That slug is already in use" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to update post" });
  }
});

// DELETE /api/admin/posts/:id
router.delete("/posts/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.post.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Post not found" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

module.exports = router;
