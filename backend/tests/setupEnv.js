// Loads test settings before any app code is imported.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.test"), quiet: true });

process.env.NODE_ENV = "test";
process.env.LOGIN_RATE_LIMIT = process.env.LOGIN_RATE_LIMIT || "1000";

// Safety net: the suite truncates every table, so refuse to run against a non-test database.
if (!/test/i.test(process.env.DATABASE_URL || "")) {
  throw new Error("Tests must run against a database whose name contains 'test' (set it in backend/.env.test)");
}
