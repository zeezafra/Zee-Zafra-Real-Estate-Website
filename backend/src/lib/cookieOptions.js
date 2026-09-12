const isProduction = process.env.NODE_ENV === "production";

// The frontend (Vercel) and backend (Render) live on different domains, so
// the admin session cookie is cross-site. Browsers require SameSite=None
// for a cross-site cookie to be sent at all, and SameSite=None requires
// Secure. Locally, both apps run on http://localhost, so we relax to
// Lax/non-secure there — a Secure cookie would otherwise get silently
// dropped by the browser over plain HTTP.
const ADMIN_COOKIE_NAME = "zzp_admin_token";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: SEVEN_DAYS_MS,
  path: "/",
};

module.exports = { ADMIN_COOKIE_NAME, cookieOptions };
