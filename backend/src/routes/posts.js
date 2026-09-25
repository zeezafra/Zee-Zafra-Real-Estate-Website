const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

// GET /api/posts
// Always scoped to published: true — this is the public contract, same as
// GET /api/properties?status=AVAILABLE being the public grid's contract
// (see frontend/lib/api.ts's getProperties). Drafts only ever show up
// through the admin endpoints below. Ordered newest first by `createdAt`,
// which also doubles as the post's display date (see the schema comment
// on Post for why there's no separate publishedAt).
router.get("/", async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// GET /api/posts/:slug
// Looked up by slug, not id — /blog/[slug] is the public URL shape. A
// draft (published: false) 404s here exactly like a nonexistent slug does;
// previewing an unpublished post is an admin-only concern (the admin list
// endpoint returns it, there's just no public preview route for it yet).
router.get("/:slug", async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { slug: req.params.slug },
    });

    if (!post || !post.published) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

module.exports = router;
