const express = require("express");

const router = express.Router();

// GET /api/health — proves the service is up. Once Phase 2 lands this can
// optionally also confirm the Prisma/Postgres connection; for Phase 1 it's
// a plain liveness check.
router.get("/", (req, res) => {
  res.json({ status: "ok" });
});

module.exports = router;
