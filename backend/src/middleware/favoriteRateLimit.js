const rateLimit = require("express-rate-limit");

// Guard for the second public write endpoint on this API (the first being
// the inquiry form — see inquiryRateLimit.js). Looser than that one on
// purpose: hearting several listings in a row while browsing is normal
// visitor behavior, not a red flag the way rapid-fire inquiry submissions
// are — this only needs to stop a script hammering the counter, not
// content-level spam, so there's no Turnstile/honeypot layer here either.
//
// Same `app.set("trust proxy", 1)` dependency as inquiryRateLimit/
// authRateLimit — see server.js.

const favoriteBurstLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many favorite updates — please slow down." },
});

const favoriteSustainedLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many favorite updates — please try again later." },
});

module.exports = [favoriteBurstLimit, favoriteSustainedLimit];
