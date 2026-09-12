const { PrismaClient } = require("@prisma/client");

// A single shared instance — creating a new PrismaClient per request would
// exhaust Postgres connections under load, especially on Render's free tier.
const prisma = new PrismaClient();

module.exports = prisma;
