// Run the scheduled-publish sweep once and exit — for a Render Cron Job or
// a manual test: `node scripts/publishScheduled.js`.
require("dotenv").config();
const { publishScheduled } = require("../src/lib/publishScheduled");
const prisma = require("../src/lib/prisma");

publishScheduled()
  .then((r) => console.log("[publish-scheduled]", JSON.stringify(r)))
  .finally(() => prisma.$disconnect());
