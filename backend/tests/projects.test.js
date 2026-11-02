const { api, prisma, resetDb, createUser, tokenFor, auth } = require("./helpers");

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const proposal = (facultyId) => ({
  title: "Lab Equipment Tracker",
  description: "Track lab equipment with QR codes",
  domain: "AI / ML",
  facultyId,
  startDate: "2026-11-10",
  deadline: "2027-01-31",
});

describe("student project proposals", () => {
  it("runs propose → approve, creating a team led by the student", async () => {
    const faculty = await createUser({ role: "FACULTY" });
    const student = await createUser();
    const studentToken = await tokenFor(student);

    const sent = await api().post("/api/v1/projects/proposals").set(auth(studentToken)).send(proposal(faculty.id));
    expect(sent.status).toBe(201);
    expect(sent.body.data.status).toBe("PROPOSED");
    expect(await prisma.notification.count({ where: { userId: faculty.id } })).toBe(1);

    const again = await api().post("/api/v1/projects/proposals").set(auth(studentToken)).send(proposal(faculty.id));
    expect(again.status).toBe(409);

    const approved = await api()
      .patch(`/api/v1/projects/${sent.body.data.id}/review`)
      .set(auth(await tokenFor(faculty)))
      .send({ decision: "APPROVED" });
    expect(approved.status).toBe(200);

    const team = await prisma.team.findFirst({ where: { projectId: sent.body.data.id } });
    expect(team.leaderId).toBe(student.id);
    expect((await prisma.user.findUnique({ where: { id: student.id } })).teamId).toBe(team.id);
  });

  it("requires a reason to reject and only the chosen faculty can review", async () => {
    const faculty = await createUser({ role: "FACULTY" });
    const other = await createUser({ role: "FACULTY" });
    const student = await createUser();
    const { body } = await api().post("/api/v1/projects/proposals").set(auth(await tokenFor(student))).send(proposal(faculty.id));

    const wrongFaculty = await api().patch(`/api/v1/projects/${body.data.id}/review`).set(auth(await tokenFor(other))).send({ decision: "APPROVED" });
    expect(wrongFaculty.status).toBe(404);

    const token = await tokenFor(faculty);
    const noReason = await api().patch(`/api/v1/projects/${body.data.id}/review`).set(auth(token)).send({ decision: "REJECTED" });
    expect(noReason.status).toBe(400);
    const rejected = await api().patch(`/api/v1/projects/${body.data.id}/review`).set(auth(token)).send({ decision: "REJECTED", remark: "Scope is too large" });
    expect(rejected.body.data.status).toBe("REJECTED");
  });

  it("validates dates and the chosen faculty", async () => {
    const student = await createUser();
    const res = await api()
      .post("/api/v1/projects/proposals")
      .set(auth(await tokenFor(student)))
      .send({ ...proposal(student.id), deadline: "2026-01-01" });
    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty("deadline");
  });
});

describe("project listing", () => {
  const seedProjects = async (faculty) => {
    const make = (title, domain, status, deadline) =>
      prisma.project.create({ data: { title, description: "A project", domain, status, facultyId: faculty.id, deadline: deadline ? new Date(deadline) : null } });
    await make("Placement Analytics", "Data Science", "IN_PROGRESS", "2026-12-01");
    await make("Smart Campus", "Web Development", "APPROVED", "2026-11-20");
    await make("Mess Feedback", "Mobile", "COMPLETED", null);
  };

  it("searches, filters, sorts and paginates", async () => {
    const faculty = await createUser({ role: "FACULTY" });
    await seedProjects(faculty);
    const token = await tokenFor(faculty);

    const search = await api().get("/api/v1/projects?search=campus").set(auth(token));
    expect(search.body.data.items.map((p) => p.title)).toEqual(["Smart Campus"]);

    const filtered = await api().get("/api/v1/projects?status=COMPLETED").set(auth(token));
    expect(filtered.body.data.items).toHaveLength(1);

    const sorted = await api().get("/api/v1/projects?sort=deadline&order=asc&limit=2").set(auth(token));
    expect(sorted.body.data.items.map((p) => p.title)).toEqual(["Smart Campus", "Placement Analytics"]);
    expect(sorted.body.data.pagination).toMatchObject({ total: 3, totalPages: 2 });
    expect(sorted.body.data.domains).toEqual(["Data Science", "Mobile", "Web Development"]);
  });

  it("hides other faculty's projects and rejects bad query values", async () => {
    const faculty = await createUser({ role: "FACULTY" });
    await seedProjects(faculty);
    const other = await createUser({ role: "FACULTY" });
    const res = await api().get("/api/v1/projects").set(auth(await tokenFor(other)));
    expect(res.body.data.items).toHaveLength(0);

    const bad = await api().get("/api/v1/projects?sort=password").set(auth(await tokenFor(other)));
    expect(bad.status).toBe(400);
  });

  it("lets an admin reassign a project to another faculty member", async () => {
    const admin = await createUser({ role: "ADMIN" });
    const a = await createUser({ role: "FACULTY" });
    const b = await createUser({ role: "FACULTY" });
    const project = await prisma.project.create({ data: { title: "P", description: "A project", facultyId: a.id } });
    const res = await api().patch(`/api/v1/projects/${project.id}/faculty`).set(auth(await tokenFor(admin))).send({ facultyId: b.id });
    expect(res.status).toBe(200);
    expect(res.body.data.faculty.id).toBe(b.id);
  });

  it("sets progress to 100 when a project is completed", async () => {
    const faculty = await createUser({ role: "FACULTY" });
    const project = await prisma.project.create({ data: { title: "P", description: "A project", facultyId: faculty.id } });
    const res = await api().patch(`/api/v1/projects/${project.id}`).set(auth(await tokenFor(faculty))).send({ status: "COMPLETED" });
    expect(res.body.data).toMatchObject({ status: "COMPLETED", progressPercentage: 100 });
  });
});

describe("teams", () => {
  it("only lets a team member be leader, and clears the leader on removal", async () => {
    const faculty = await createUser({ role: "FACULTY" });
    const member = await createUser();
    const outsider = await createUser();
    const project = await prisma.project.create({ data: { title: "P", description: "A project", facultyId: faculty.id } });
    const team = await prisma.team.create({ data: { name: "Alpha", projectId: project.id } });
    await prisma.user.update({ where: { id: member.id }, data: { teamId: team.id } });
    const token = await tokenFor(faculty);

    expect((await api().patch(`/api/v1/teams/${team.id}`).set(auth(token)).send({ leaderId: outsider.id })).status).toBe(400);
    const ok = await api().patch(`/api/v1/teams/${team.id}`).set(auth(token)).send({ leaderId: member.id, name: "Alpha Squad" });
    expect(ok.body.data).toMatchObject({ name: "Alpha Squad", leader: { id: member.id } });

    await api().delete(`/api/v1/teams/${team.id}/members/${member.id}`).set(auth(token));
    expect((await prisma.team.findUnique({ where: { id: team.id } })).leaderId).toBeNull();
  });

  it("refuses teams for projects that are not approved", async () => {
    const faculty = await createUser({ role: "FACULTY" });
    const project = await prisma.project.create({ data: { title: "P", description: "A project", status: "PROPOSED", facultyId: faculty.id } });
    const res = await api().post("/api/v1/teams").set(auth(await tokenFor(faculty))).send({ name: "Team", projectId: project.id });
    expect(res.status).toBe(400);
  });

  it("deletes a team and frees its members", async () => {
    const faculty = await createUser({ role: "FACULTY" });
    const member = await createUser();
    const project = await prisma.project.create({ data: { title: "P", description: "A project", facultyId: faculty.id } });
    const team = await prisma.team.create({ data: { name: "Alpha", projectId: project.id } });
    await prisma.user.update({ where: { id: member.id }, data: { teamId: team.id } });
    const res = await api().delete(`/api/v1/teams/${team.id}`).set(auth(await tokenFor(faculty)));
    expect(res.status).toBe(200);
    expect((await prisma.user.findUnique({ where: { id: member.id } })).teamId).toBeNull();
  });
});

describe("late reports", () => {
  it("flags a report submitted after its week ended", async () => {
    const faculty = await createUser({ role: "FACULTY" });
    const student = await createUser();
    const project = await prisma.project.create({
      data: { title: "P", description: "A project", facultyId: faculty.id, startDate: new Date("2026-01-05") },
    });
    const team = await prisma.team.create({ data: { name: "Alpha", projectId: project.id } });
    await prisma.user.update({ where: { id: student.id }, data: { teamId: team.id } });

    const res = await api()
      .post("/api/v1/submissions")
      .set(auth(await tokenFor(student)))
      .send({ weekNumber: 1, title: "Week 1", description: "Did things" });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ dueDate: "2026-01-11", isLate: true });
  });
});
