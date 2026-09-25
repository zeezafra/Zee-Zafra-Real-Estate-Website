const cors = require("cors");

// FRONTEND_ORIGIN is the deployed Vercel URL (or localhost during dev). It
// can be a comma-separated list — useful once there's a custom domain in
// play (apex + www) or a Vercel preview alias that also needs access.
// Phase 11 hardening: this is an explicit allow-list, never "*", and
// anything not on it is rejected rather than silently trusted.
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsMiddleware = cors({
  origin(origin, callback) {
    // No Origin header means a non-browser request (server-to-server call,
    // curl, Render's own health checks) — there's no cross-origin browser
    // request to police, so let it through.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true, // needed from Phase 3 onward for the admin auth cookie
});

module.exports = corsMiddleware;
