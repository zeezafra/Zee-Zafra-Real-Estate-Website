const express = require("express");
const requireAdmin = require("../middleware/requireAdmin");
const prisma = require("../lib/prisma");

const router = express.Router();

// GET /api/admin/guide-leads — everyone who downloaded a guide, newest first.
router.get("/guide-leads", requireAdmin, async (req, res) => {
  try {
    const rows = await prisma.guideLead.findMany({ orderBy: { createdAt: "desc" } });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch guide leads" });
  }
});

router.delete("/guide-leads/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.guideLead.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error(err);
    res.status(500).json({ error: "Failed to remove guide lead" });
  }
});

module.exports = router;
