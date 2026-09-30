const rateLimit = require("express-rate-limit");

// Trust & polish. The guide form writes a row and emails Zee, so it gets the
// same shape of limits as alert sign-ups: a short burst cap plus an hourly cap.
const burst = rateLimit({
  windowMs: 60 * 1000,
  max: 4,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "You're going a bit fast — please wait a moment and try again." },
});

const sustained = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this connection. Please try again later." },
});

module.exports = { guideLimits: [burst, sustained] };
