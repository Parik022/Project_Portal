const { api, prisma, resetDb, createUser, tokenFor, auth } = require("./helpers");

const setupTeam = async () => {
  const faculty = await createUser({ role: "FACULTY" });
  const student = await createUser();
  const project = await prisma.project.create({ data: { title: "Portal", description: "A project", facultyId: faculty.id } });
  const team = await prisma.team.create({ data: { name: "Alpha", projectId: project.id } });
  await prisma.user.update({ where: { id: student.id }, data: { teamId: team.id } });
  return { faculty, student, project, team };
};

const report = { weekNumber: 1, title: "Week 1", description: "Set up the project", link: "https://github.com/x/y" };

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("weekly reports", () => {
  it("requires a team before submitting", async () => {
    const student = await createUser();
    const res = await api().post("/api/v1/submissions").set(auth(await tokenFor(student))).send(report);
    expect(res.status).toBe(400);
  });

  it("submits once per week and notifies the project faculty", async () => {
    const { faculty, student } = await setupTeam();
    const token = await tokenFor(student);

    const first = await api().post("/api/v1/submissions").set(auth(token)).send(report);
    expect(first.status).toBe(201);
    expect(await prisma.notification.count({ where: { userId: faculty.id } })).toBe(1);

    const dup = await api().post("/api/v1/submissions").set(auth(token)).send(report);
    expect(dup.status).toBe(409);
  });

  it("rejects invalid links and missing fields", async () => {
    const { student } = await setupTeam();
    const res = await api().post("/api/v1/submissions").set(auth(await tokenFor(student))).send({ weekNumber: 0, link: "not a url" });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.errors)).toEqual(expect.arrayContaining(["weekNumber", "title", "description", "link"]));
  });

  it("runs the review loop: changes requested → resubmit → approved → locked", async () => {
    const { faculty, student } = await setupTeam();
    const studentToken = await tokenFor(student);
    const facultyToken = await tokenFor(faculty);
    const { body } = await api().post("/api/v1/submissions").set(auth(studentToken)).send(report);
    const id = body.data.id;

    const noFeedback = await api().patch(`/api/v1/submissions/${id}/review`).set(auth(facultyToken)).send({ status: "CHANGES_REQUESTED" });
    expect(noFeedback.status).toBe(400);

    await api().patch(`/api/v1/submissions/${id}/review`).set(auth(facultyToken)).send({ status: "CHANGES_REQUESTED", feedback: "Add screenshots" });
    const resubmitted = await api().patch(`/api/v1/submissions/${id}`).set(auth(studentToken)).send({ description: "Added screenshots" });
    expect(resubmitted.body.data.status).toBe("PENDING");

    const approved = await api().patch(`/api/v1/submissions/${id}/review`).set(auth(facultyToken)).send({ status: "APPROVED" });
    expect(approved.body.data.status).toBe("APPROVED");

    const locked = await api().patch(`/api/v1/submissions/${id}`).set(auth(studentToken)).send({ description: "Late edit" });
    expect(locked.status).toBe(400);
  });

  it("hides other students' reports", async () => {
    const { student } = await setupTeam();
    const { body } = await api().post("/api/v1/submissions").set(auth(await tokenFor(student))).send(report);
    const outsider = await createUser();
    const res = await api().get(`/api/v1/submissions/${body.data.id}`).set(auth(await tokenFor(outsider)));
    expect(res.status).toBe(404);
  });

  it("stops faculty from reviewing reports on someone else's project", async () => {
    const { student } = await setupTeam();
    const { body } = await api().post("/api/v1/submissions").set(auth(await tokenFor(student))).send(report);
    const otherFaculty = await createUser({ role: "FACULTY" });
    const res = await api()
      .patch(`/api/v1/submissions/${body.data.id}/review`)
      .set(auth(await tokenFor(otherFaculty)))
      .send({ status: "APPROVED" });
    expect(res.status).toBe(404);
  });
});

describe("system", () => {
  it("reports health and returns JSON 404s for unknown routes", async () => {
    expect((await api().get("/api/v1/health")).body.data.database).toBe("up");
    const res = await api().get("/api/v1/nope");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("rejects malformed JSON with 400", async () => {
    const res = await api().post("/api/v1/auth/login").set("Content-Type", "application/json").send("{bad json");
    expect(res.status).toBe(400);
  });
});
