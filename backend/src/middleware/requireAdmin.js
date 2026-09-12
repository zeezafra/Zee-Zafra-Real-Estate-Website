const { verifyAdminToken } = require("../lib/jwt");
const { ADMIN_COOKIE_NAME } = require("../lib/cookieOptions");

// Apply this to every Phase 4+ admin endpoint (property create/edit/delete,
// image upload, the Phase 10 inquiries inbox), not just the /me route below.
function requireAdmin(req, res, next) {
  const token = req.cookies?.[ADMIN_COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const payload = verifyAdminToken(token);
    req.admin = { id: payload.adminId, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

module.exports = requireAdmin;
