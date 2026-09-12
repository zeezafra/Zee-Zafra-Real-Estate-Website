require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// One-off provisioning script for the single admin account. Deliberately
// NOT wired into `prisma db seed` (which reseeds property listings and is
// meant to be safe to re-run during development) — this one you run
// intentionally, once, whenever you want to create the admin login or
// rotate its password.
//
// Usage (local):
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD="a-real-password" node prisma/seedAdmin.js
// or set ADMIN_EMAIL / ADMIN_PASSWORD in backend/.env and just run:
//   node prisma/seedAdmin.js
//
// Against the production database: point DATABASE_URL (temporarily, in your
// local .env) at the Render Postgres instance's *external* connection
// string, then run the command above. Render's free tier has no shell
// access, so this is the supported way to provision the admin account —
// see the "How to test" section for the full walkthrough.
async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD (env vars or backend/.env) before running this script."
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  console.log(`Admin user ready: ${admin.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
