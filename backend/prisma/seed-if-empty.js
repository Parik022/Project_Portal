// Runs the demo seed only when the database has no users yet.
// Safe to call on every deploy: it never wipes real data.
require("dotenv").config({ quiet: true });
const { execFileSync } = require("child_process");
const path = require("path");
const { prisma } = require("../src/config/database");

(async () => {
  const users = await prisma.user.count();
  await prisma.$disconnect();
  if (users > 0) {
    console.log(`Database already has ${users} users, skipping demo seed.`);
    return;
  }
  console.log("Empty database, loading demo data…");
  execFileSync(process.execPath, [path.join(__dirname, "seed.js")], { stdio: "inherit" });
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
