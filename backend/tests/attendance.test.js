const { api, prisma, resetDb, createUser, tokenFor, auth, freezeDate } = require("./helpers");
const { countWorkingDays, toDateOnly } = require("../src/utils/date");
const { summarize } = require("../src/services/attendance.service");

const WEDNESDAY = "2026-11-04T05:00:00.000Z"; // 10:30 IST
const SATURDAY = "2026-11-07T05:00:00.000Z";

const setupStudent = async () => {
  const guide = await createUser({ role: "FACULTY" });
  const student = await createUser({ guideId: guide.id });
  await prisma.internship.create({
    data: {
      studentId: student.id,
      company: "Zoho",
      position: "Intern",
      startDate: toDateOnly("2026-11-02"),
      endDate: toDateOnly("2026-12-31"),
    },
  });
  return { guide, student };
};

const mark = (token) =>
  api().post("/api/v1/attendance").set(auth(token)).send({ mode: "REMOTE", summary: "Worked on the attendance module" });

beforeEach(async () => {
  await resetDb();
  freezeDate(WEDNESDAY);
});
afterEach(() => jest.useRealTimers());
afterAll(() => prisma.$disconnect());

describe("working-day maths (pure business logic)", () => {
  it("counts Monday to Friday only, inclusive", () => {
    expect(countWorkingDays(toDateOnly("2026-11-02"), toDateOnly("2026-11-08"))).toBe(5); // Mon..Sun
    expect(countWorkingDays(toDateOnly("2026-11-07"), toDateOnly("2026-11-08"))).toBe(0); // weekend
    expect(countWorkingDays(toDateOnly("2026-11-05"), toDateOnly("2026-11-02"))).toBe(0); // reversed
  });

  it("computes percentage from verified days over elapsed working days", () => {
    const student = { id: "s", internship: { startDate: toDateOnly("2026-11-02"), endDate: toDateOnly("2026-12-31") } };
    const result = summarize(student, { VERIFIED: 2, PENDING: 1 }, toDateOnly("2026-11-06")); // Mon..Fri = 5 days
    expect(result).toMatchObject({ workingDays: 5, present: 2, pending: 1, absent: 2, percentage: 40, isLow: true });
  });
});

describe("POST /attendance (student check-in)", () => {
  it("requires internship details first", async () => {
    const student = await createUser();
    const res = await mark(await tokenFor(student));
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/internship/i);
  });

  it("records today's attendance as PENDING and notifies the guide", async () => {
    const { guide, student } = await setupStudent();
    const res = await mark(await tokenFor(student));
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ status: "PENDING", mode: "REMOTE" });
    expect(res.body.data.date).toMatch(/^2026-11-04/);
    expect(await prisma.notification.count({ where: { userId: guide.id } })).toBe(1);
  });

  it("blocks a second check-in on the same day with 409", async () => {
    const { student } = await setupStudent();
    const token = await tokenFor(student);
    await mark(token);
    const res = await mark(token);
    expect(res.status).toBe(409);
  });

  it("blocks weekend check-ins", async () => {
    const { student } = await setupStudent();
    const token = await tokenFor(student);
    freezeDate(SATURDAY);
    const res = await mark(token);
    expect(res.status).toBe(400);
  });

  it("validates the summary", async () => {
    const { student } = await setupStudent();
    const res = await api().post("/api/v1/attendance").set(auth(await tokenFor(student))).send({ mode: "REMOTE", summary: "hi" });
    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty("summary");
  });

  it("is not available to faculty", async () => {
    const faculty = await createUser({ role: "FACULTY" });
    expect((await mark(await tokenFor(faculty))).status).toBe(403);
  });
});

describe("PATCH /attendance/:id/verify", () => {
  const checkIn = async () => {
    const people = await setupStudent();
    const res = await mark(await tokenFor(people.student));
    return { ...people, recordId: res.body.data.id };
  };

  it("lets the assigned guide verify", async () => {
    const { guide, student, recordId } = await checkIn();
    const res = await api().patch(`/api/v1/attendance/${recordId}/verify`).set(auth(await tokenFor(guide))).send({ status: "VERIFIED" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("VERIFIED");

    const stats = await api().get("/api/v1/attendance/stats").set(auth(await tokenFor(student)));
    expect(stats.body.data).toMatchObject({ workingDays: 3, present: 1 });
  });

  it("forbids a faculty member who is not the guide", async () => {
    const { recordId } = await checkIn();
    const otherFaculty = await createUser({ role: "FACULTY" });
    const res = await api().patch(`/api/v1/attendance/${recordId}/verify`).set(auth(await tokenFor(otherFaculty))).send({ status: "VERIFIED" });
    expect(res.status).toBe(403);
  });

  it("requires a remark when rejecting", async () => {
    const { guide, recordId } = await checkIn();
    const token = await tokenFor(guide);
    const missing = await api().patch(`/api/v1/attendance/${recordId}/verify`).set(auth(token)).send({ status: "REJECTED" });
    expect(missing.status).toBe(400);
    const ok = await api().patch(`/api/v1/attendance/${recordId}/verify`).set(auth(token)).send({ status: "REJECTED", remark: "No work logged" });
    expect(ok.status).toBe(200);
  });

  it("returns 404 for a record that does not exist", async () => {
    const { guide } = await setupStudent();
    const res = await api()
      .patch("/api/v1/attendance/cm0000000000000000000000/verify")
      .set(auth(await tokenFor(guide)))
      .send({ status: "VERIFIED" });
    expect(res.status).toBe(404);
  });
});

describe("GET /attendance scoping", () => {
  it("shows each role only the students they are responsible for", async () => {
    const { guide, student } = await setupStudent();
    await mark(await tokenFor(student));
    const otherFaculty = await createUser({ role: "FACULTY" });
    const otherStudent = await createUser();

    const forGuide = await api().get("/api/v1/attendance").set(auth(await tokenFor(guide)));
    const forOther = await api().get("/api/v1/attendance").set(auth(await tokenFor(otherFaculty)));
    const forOtherStudent = await api().get("/api/v1/attendance").set(auth(await tokenFor(otherStudent)));

    expect(forGuide.body.data.items).toHaveLength(1);
    expect(forOther.body.data.items).toHaveLength(0);
    expect(forOtherStudent.body.data.items).toHaveLength(0);
  });
});
