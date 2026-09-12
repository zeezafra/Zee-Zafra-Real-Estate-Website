const jwt = require("jsonwebtoken");

const TOKEN_EXPIRY = "7d"; // keep in sync with cookieOptions.js's maxAge

function signAdminToken(admin) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }

  return jwt.sign({ adminId: admin.id, email: admin.email }, secret, {
    expiresIn: TOKEN_EXPIRY,
  });
}

function verifyAdminToken(token) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }

  return jwt.verify(token, secret);
}

module.exports = { signAdminToken, verifyAdminToken };
