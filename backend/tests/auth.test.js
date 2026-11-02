const jwt = require("jsonwebtoken");
const { api, prisma, resetDb, createUser, tokenFor, auth, PASSWORD } = require("./helpers");

const student = {
  name: "Siddharth Sengupta",
  email: "ss1234@srmist.edu.in",
  password: "Password123",
  role: "STUDENT",
  registerNo: "RA2411030010438",
  department: "CSE",
};

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("POST /auth/register", () => {
  it("registers a student with an SRM email and returns a token", async () => {
    const res = await api().post("/api/v1/auth/register").send(student);
    expect(res.status).toBe(201);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).not.toHaveProperty("password");

    const saved = await prisma.user.findUnique({ where: { email: student.email } });
    expect(saved.password).not.toBe(student.password); // stored as a bcrypt hash
  });

  it("rejects emails outside @srmist.edu.in", async () => {
    const res = await api().post("/api/v1/auth/register").send({ ...student, email: "someone@gmail.com" });
    expect(res.status).toBe(400);
    expect(res.body.errors.email[0]).toMatch(/srmist\.edu\.in/);
  });

  it("rejects weak passwords and a missing register number", async () => {
    const res = await api()
      .post("/api/v1/auth/register")
      .send({ ...student, password: "short", registerNo: undefined });
    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty("password");
    expect(res.body.errors).toHaveProperty("registerNo");
  });

  it("does not allow self-registration as HOD or admin", async () => {
    const res = await api().post("/api/v1/auth/register").send({ ...student, role: "ADMIN" });
    expect(res.status).toBe(400);
  });

  it("returns 409 for a duplicate email", async () => {
    await api().post("/api/v1/auth/register").send(student);
    const res = await api().post("/api/v1/auth/register").send({ ...student, registerNo: "RA2411030010439" });
    expect(res.status).toBe(409);
  });

  it("creates faculty accounts as inactive until an admin approves them", async () => {
    const res = await api()
      .post("/api/v1/auth/register")
      .send({ ...student, email: "prof@srmist.edu.in", role: "FACULTY", registerNo: undefined });
    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeNull();

    const login = await api().post("/api/v1/auth/login").send({ email: "prof@srmist.edu.in", password: student.password });
    expect(login.status).toBe(403);
    expect(login.body.message).toMatch(/approval/);
  });
});

describe("POST /auth/login", () => {
  it("logs in with correct credentials", async () => {
    const user = await createUser();
    const res = await api().post("/api/v1/auth/login").send({ email: user.email, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(jwt.decode(res.body.data.token)).toMatchObject({ userId: user.id, role: "STUDENT" });
  });

  it("returns the same 401 for unknown email and wrong password", async () => {
    const user = await createUser();
    const wrong = await api().post("/api/v1/auth/login").send({ email: user.email, password: "nope" });
    const unknown = await api().post("/api/v1/auth/login").send({ email: "ghost@srmist.edu.in", password: "nope" });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.message).toBe(unknown.body.message);
  });
});

describe("authentication middleware", () => {
  it("rejects requests without a token", async () => {
    const res = await api().get("/api/v1/auth/profile");
    expect(res.status).toBe(401);
  });

  it("rejects tampered and expired tokens", async () => {
    const user = await createUser();
    const tampered = jwt.sign({ userId: user.id }, "not-the-real-secret");
    const expired = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: -10 });

    expect((await api().get("/api/v1/auth/profile").set(auth(tampered))).status).toBe(401);
    const res = await api().get("/api/v1/auth/profile").set(auth(expired));
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/expired/);
  });

  it("blocks a valid token once the account is deactivated", async () => {
    const user = await createUser();
    const token = await tokenFor(user);
    await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });
    const res = await api().get("/api/v1/auth/profile").set(auth(token));
    expect(res.status).toBe(403);
  });
});

describe("PATCH /auth/password", () => {
  it("changes the password only when the current one is right", async () => {
    const user = await createUser();
    const token = await tokenFor(user);

    const bad = await api().patch("/api/v1/auth/password").set(auth(token)).send({ currentPassword: "wrong", newPassword: "NewPass123" });
    expect(bad.status).toBe(400);

    const ok = await api().patch("/api/v1/auth/password").set(auth(token)).send({ currentPassword: PASSWORD, newPassword: "NewPass123" });
    expect(ok.status).toBe(200);

    const login = await api().post("/api/v1/auth/login").send({ email: user.email, password: "NewPass123" });
    expect(login.status).toBe(200);
  });
});
