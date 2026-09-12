const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { signAdminToken } = require("../lib/jwt");
const { ADMIN_COOKIE_NAME, cookieOptions } = require("../lib/cookieOptions");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

// Valid-format bcrypt hash of a value nobody will ever type, computed once
// at startup. Used as the comparison target when no AdminUser matches the
// submitted email, so a login attempt against an unknown email takes the
// same code path (and roughly the same time) as one against a known email
// with the wrong password, rather than short-circuiting and leaking via
// timing which emails exist.
const DUMMY_HASH = bcrypt.hashSync("no-such-admin-account", 10);

// POST /api/admin/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    const admin = await prisma.adminUser.findUnique({ where: { email } });
    const valid = await bcrypt.compare(
      password,
      admin?.passwordHash ?? DUMMY_HASH
    );

    if (!admin || !valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signAdminToken(admin);
    res.cookie(ADMIN_COOKIE_NAME, token, cookieOptions);
    res.json({ email: admin.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/admin/logout
router.post("/logout", (req, res) => {
  // clearCookie needs the same attributes used to set it (minus maxAge) or
  // some browsers won't match and remove it.
  const { maxAge, ...clearOptions } = cookieOptions;
  res.clearCookie(ADMIN_COOKIE_NAME, clearOptions);
  res.json({ ok: true });
});

// GET /api/admin/me — not part of the roadmap's explicit endpoint list, but
// needed so the frontend's server-side layout check (Next.js Server
// Component, no access to the backend's JWT_SECRET) can ask the backend
// "is this cookie a valid admin session?" instead of duplicating JWT
// verification logic on the frontend.
router.get("/me", requireAdmin, (req, res) => {
  res.json({ email: req.admin.email });
});

module.exports = router;
