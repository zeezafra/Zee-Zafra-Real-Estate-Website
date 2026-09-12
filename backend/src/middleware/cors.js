const cors = require("cors");

// FRONTEND_ORIGIN is the deployed Vercel URL (or localhost during dev).
// Never hardcode an origin here — Phase 11 locks this down further for
// production, but even in Phase 1 we read it from the environment so
// the habit is right from day one.
const allowedOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

const corsMiddleware = cors({
  origin: allowedOrigin,
  credentials: true, // needed from Phase 3 onward for the admin auth cookie
});

module.exports = corsMiddleware;
