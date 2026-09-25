const rateLimit = require("express-rate-limit");

// Spam guard for the one public write endpoint on this API — every other
// mutating route sits behind requireAdmin.
//
// Relies on `app.set("trust proxy", 1)` in server.js: Render sits behind a
// proxy, so without that setting every request looks like it comes from
// the same proxy IP (or express-rate-limit refuses to start, depending on
// version) rather than the real client.
//
// Phase 20 turns the single Phase 10 limiter into two stacked windows,
// because one window can't cover both attack shapes on its own:
//
//   burst     — 3 per minute. Stops a script hammering the endpoint and
//               stops a real visitor's double-clicked submit button.
//   sustained — 5 per 15 minutes (the original Phase 10 limit, unchanged).
//               Stops slow-drip abuse that stays under the burst ceiling.
//
// Exported as an array, which Express mounts as an ordered middleware
// chain — so the route signature (`router.post("/", inquiryRateLimit, …)`)
// doesn't change.

const inquiryBurstLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "You're sending those a bit fast — please wait a moment and try again." },
});

const inquirySustainedLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many inquiries submitted. Please try again later." },
});

module.exports = [inquiryBurstLimit, inquirySustainedLimit];
