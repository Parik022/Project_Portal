const { api, prisma, resetDb, createUser, tokenFor, auth } = require("./helpers");

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("role-based access to /users", () => {
  it("forbids students and faculty", async () => {
    const student = await createUser();
    const faculty = await createUser({ role: "FACULTY" });
    expect((await api().get("/api/v1/users").set(auth(await tokenFor(student)))).status).toBe(403);
    expect((await api().get("/api/v1/users").set(auth(await tokenFor(faculty)))).status).toBe(403);
  });

  it("limits a HOD to their own department", async () => {
    const hod = await createUser({ role: "HOD", department: "CSE" });
    await createUser({ department: "CSE" });
    await createUser({ department: "ECE" });

    const res = await api().get("/api/v1/users?role=STUDENT").set(auth(await tokenFor(hod)));
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].department).toBe("CSE");
  });

  it("supports search and pagination for admins", async () => {
    const admin = await createUser({ role: "ADMIN" });
    await createUser({ name: "Aarav Mehta" });
    await createUser({ name: "Diya Sharma" });

    const res = await api().get("/api/v1/users?search=aarav&limit=1").set(auth(await tokenFor(admin)));
    expect(res.status).toBe(200);
    expect(res.body.data.items[0].name).toBe("Aarav Mehta");
    expect(res.body.data.pagination).toMatchObject({ page: 1, limit: 1, total: 1 });
  });

  it("returns 400 for a malformed id", async () => {
    const admin = await createUser({ role: "ADMIN" });
    const res = await api().get("/api/v1/users/not-an-id").set(auth(await tokenFor(admin)));
    expect(res.status).toBe(400);
  });
});

describe("admin actions", () => {
  it("approves a pending faculty account so they can log in", async () => {
    const admin = await createUser({ role: "ADMIN" });
    const faculty = await createUser({ role: "FACULTY", isActive: false });

    const res = await api().patch(`/api/v1/users/${faculty.id}`).set(auth(await tokenFor(admin))).send({ isActive: true });
    expect(res.status).toBe(200);
    await expect(tokenFor(faculty)).resolves.toEqual(expect.any(String));
  });

  it("assigns only active faculty as guides", async () => {
    const admin = await createUser({ role: "ADMIN" });
    const token = await tokenFor(admin);
    const student = await createUser();
    const guide = await createUser({ role: "FACULTY" });
    const anotherStudent = await createUser();

    const bad = await api().patch(`/api/v1/users/${student.id}/guide`).set(auth(token)).send({ guideId: anotherStudent.id });
    expect(bad.status).toBe(400);

    const ok = await api().patch(`/api/v1/users/${student.id}/guide`).set(auth(token)).send({ guideId: guide.id });
    expect(ok.status).toBe(200);
    expect(ok.body.data.guide.id).toBe(guide.id);
  });

  it("does not let an admin deactivate themselves", async () => {
    const admin = await createUser({ role: "ADMIN" });
    const res = await api().delete(`/api/v1/users/${admin.id}`).set(auth(await tokenFor(admin)));
    expect(res.status).toBe(400);
  });
});
