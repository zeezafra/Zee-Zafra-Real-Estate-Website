const rateLimit = require("express-rate-limit");

// Phase 20. Brute-force guard on POST /api/admin/login.
//
// This is the other unauthenticated write surface on the API (the inquiry
// form being the first), and until now nothing capped how many passwords
// could be tried against the single admin account. bcrypt's own cost
// factor slows an attacker down but doesn't stop them.
//
// `skipSuccessfulRequests` means Zee's own correct logins never count
// toward the limit — only failures do, so a legitimate admin logging in
// repeatedly across sessions can't lock themselves out. 10 failures per
// IP per 15 minutes leaves plenty of room for a genuinely mistyped
// password.
//
// Mounted on the login route itself rather than globally, per the
// roadmap's "keep them close to the routes they protect" note.
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many failed login attempts. Please try again in a few minutes." },
});

module.exports = authRateLimit;
