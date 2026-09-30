const express = require("express");
const requireAdmin = require("../middleware/requireAdmin");
const prisma = require("../lib/prisma");

const router = express.Router();

// GET /api/admin/alerts — every saved search, newest first. `token` is left
// out: it's the subscriber's own confirm/unsubscribe credential.
router.get("/alerts", requireAdmin, async (req, res) => {
  try {
    const rows = await prisma.savedSearch.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, email: true, name: true, location: true, type: true, listingType: true,
        minPrice: true, maxPrice: true, minBeds: true, confirmedAt: true,
        lastNotifiedAt: true, createdAt: true,
      },
    });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch alert subscribers" });
  }
});

router.delete("/alerts/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.savedSearch.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error(err);
    res.status(500).json({ error: "Failed to remove subscriber" });
  }
});

module.exports = router;
