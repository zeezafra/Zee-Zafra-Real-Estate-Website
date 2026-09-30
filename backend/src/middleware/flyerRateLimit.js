const rateLimit = require("express-rate-limit");

// Phase 26. The flyer route fetches photos and renders a PDF per request —
// the most expensive public GET on this API — so it gets its own limit.
module.exports = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many flyer downloads — please try again in a minute." },
});
