const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("../src/app");
const { prisma } = require("../src/config/database");

const PASSWORD = "Password123";
let passwordHash;

const api = () => request(app);

const resetDb = async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "Notification", "Attendance", "Submission", "Internship", "Team", "Project", "User" RESTART IDENTITY CASCADE'
  );
};

let counter = 0;
const createUser = async (overrides = {}) => {
  passwordHash = passwordHash || (await bcrypt.hash(PASSWORD, 4));
  counter += 1;
  const role = overrides.role || "STUDENT";
  return prisma.user.create({
    data: {
      name: `Test ${role} ${counter}`,
      email: `${role.toLowerCase()}${counter}@srmist.edu.in`,
      password: passwordHash,
      role,
      department: "CSE",
      registerNo: role === "STUDENT" ? `RA${String(2411030000000 + counter)}` : null,
      ...overrides,
    },
  });
};

const tokenFor = async (user) => {
  const res = await api().post("/api/v1/auth/login").send({ email: user.email, password: PASSWORD });
  if (!res.body.data?.token) throw new Error(`Login failed for ${user.email}: ${res.body.message}`);
  return res.body.data.token;
};

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// Freeze "now" without freezing timers, so database and HTTP calls keep working.
const freezeDate = (iso) =>
  jest.useFakeTimers({
    now: new Date(iso),
    doNotFake: [
      "hrtime", "nextTick", "performance", "queueMicrotask", "requestAnimationFrame", "cancelAnimationFrame",
      "requestIdleCallback", "cancelIdleCallback", "setImmediate", "clearImmediate", "setInterval",
      "clearInterval", "setTimeout", "clearTimeout",
    ],
  });

module.exports = { api, prisma, resetDb, createUser, tokenFor, auth, freezeDate, PASSWORD };
