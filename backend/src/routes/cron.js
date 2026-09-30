const crypto = require("crypto");
const express = require("express");
const { sendDailyDigest } = require("../lib/dailyDigest");
const { publishScheduled } = require("../lib/publishScheduled");

const router = express.Router();

// Constant-time comparison so the secret can't be recovered by timing.
function secretMatches(provided, expected) {
  const a = Buffer.from(String(provided || ""));
  const b = Buffer.from(String(expected || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// POST /api/cron/daily-digest  — header: Authorization: Bearer <CRON_SECRET>
// Render's free web service has no scheduler, so an external cron (the
// GitHub Actions workflow in .github/workflows/daily-digest.yml, or
// cron-job.org) calls this once a morning. With CRON_SECRET unset the
// endpoint is disabled entirely (404), never open.
router.post("/daily-digest", async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return res.status(404).json({ error: "Not found" });

  const auth = req.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!secretMatches(token, secret)) return res.status(401).json({ error: "Unauthorized" });

  const result = await sendDailyDigest();
  res.json(result);
});

// POST /api/cron/publish-scheduled — header: Authorization: Bearer <CRON_SECRET>
// Phase 27. Flips due DRAFT properties and unpublished-but-scheduled posts
// live. Meant to run frequently (every 10-15 min) — see the GitHub Actions
// workflow — since "publish at 9:00 AM" should mean close to 9:00, not
// whenever the once-a-day digest happens to run.
router.post("/publish-scheduled", async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return res.status(404).json({ error: "Not found" });

  const auth = req.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!secretMatches(token, secret)) return res.status(401).json({ error: "Unauthorized" });

  const result = await publishScheduled();
  res.json(result);
});

module.exports = router;
