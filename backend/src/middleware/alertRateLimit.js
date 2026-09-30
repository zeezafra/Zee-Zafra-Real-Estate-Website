const rateLimit = require("express-rate-limit");

// Phase 26. Public alert sign-up writes a row AND sends an email, so it is
// limited harder than the favorite counter. Applies to sign-up only;
// confirm/unsubscribe carry an unguessable token and use the looser limit.
const signupBurst = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "You're going a bit fast — please wait a moment and try again." },
});

const signupSustained = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many alert sign-ups from this connection. Please try again later." },
});

const tokenActionLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please try again later." },
});

module.exports = { signupLimits: [signupBurst, signupSustained], tokenActionLimit };
