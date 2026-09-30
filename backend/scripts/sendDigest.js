// Run the daily digest once and exit — for Render Cron Jobs or a manual
// test: `node scripts/sendDigest.js` (needs DATABASE_URL + RESEND_API_KEY).
require("dotenv").config();
const { sendDailyDigest } = require("../src/lib/dailyDigest");
const prisma = require("../src/lib/prisma");

sendDailyDigest()
  .then((r) => console.log("[digest]", JSON.stringify(r)))
  .finally(() => prisma.$disconnect());
