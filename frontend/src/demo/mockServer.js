// In-browser stand-in for the ProjectFlow API, used only by the demo build
// (VITE_DEMO=true). It mirrors the real backend's routes, response shapes and
// business rules closely enough to click through every role, but keeps all
// data in this browser. The real API lives in /backend and has its own tests.

const STORAGE_KEY = "projectflow-demo-db-v2";
const PASSWORD = "Password123";
const THRESHOLD = 75;
const MAX_TEAM_SIZE = 4;
const DOMAIN = "srmist.edu.in";

/* ------------------------------------------------------------------ */
/* Dates (IST calendar days, stored as YYYY-MM-DD strings)             */
/* ------------------------------------------------------------------ */

const ymdIST = (d = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const toDate = (ymd) => new Date(`${ymd}T00:00:00.000Z`);
const addDays = (ymd, n) => {
  const d = toDate(ymd);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const isWeekend = (ymd) => [0, 6].includes(toDate(ymd).getUTCDay());
const workingDays = (start, end) => {
  if (end < start) return 0;
  let n = 0;
  for (let d = start; d <= end; d = addDays(d, 1)) if (!isWeekend(d)) n += 1;
  return n;
};
const iso = (ymd) => `${ymd}T00:00:00.000Z`;
const now = () => new Date().toISOString();

/* ------------------------------------------------------------------ */
/* Seed data (same people as backend/prisma/seed.js)                    */
/* ------------------------------------------------------------------ */

let counter = 0;
const id = () => `demo${Date.now().toString(36)}${(counter++).toString(36)}`;

const SUMMARIES = [
  "Worked on REST endpoints and fixed validation bugs",
  "Attended sprint planning and wrote unit tests",
  "Built a dashboard page and connected it to the API",
  "Reviewed pull requests and refactored the service layer",
  "Researched caching options and documented findings",
];

function seed() {
  const today = ymdIST();
  const start = addDays(today, -28);
  const end = addDays(today, 56);
  const u = (o) => ({
    id: o.key,
    password: PASSWORD,
    department: "CSE",
    isActive: true,
    registerNo: null,
    teamId: null,
    guideId: null,
    createdAt: iso(addDays(today, -40)),
    ...o,
  });

  const users = [
    u({ key: "admin", name: "Portal Admin", email: "admin@srmist.edu.in", role: "ADMIN" }),
    u({ key: "hod", name: "Dr. Meena Krishnan", email: "hod.cse@srmist.edu.in", role: "HOD" }),
    u({ key: "priya", name: "Dr. Priya Raman", email: "faculty1@srmist.edu.in", role: "FACULTY" }),
    u({ key: "arun", name: "Dr. Arun Kumar", email: "faculty2@srmist.edu.in", role: "FACULTY" }),
    u({ key: "vikram", name: "Dr. Vikram Rao", email: "faculty.pending@srmist.edu.in", role: "FACULTY", isActive: false, createdAt: iso(addDays(today, -1)) }),
    u({ key: "aarav", name: "Aarav Mehta", email: "student1@srmist.edu.in", role: "STUDENT", registerNo: "RA2411030010001", guideId: "priya", teamId: "alpha" }),
    u({ key: "diya", name: "Diya Sharma", email: "student2@srmist.edu.in", role: "STUDENT", registerNo: "RA2411030010002", guideId: "priya", teamId: "alpha" }),
    u({ key: "rohan", name: "Rohan Iyer", email: "student3@srmist.edu.in", role: "STUDENT", registerNo: "RA2411030010003", guideId: "arun", teamId: "beta" }),
    u({ key: "kavya", name: "Kavya Nair", email: "student4@srmist.edu.in", role: "STUDENT", registerNo: "RA2411030010004" }),
  ];

  const internships = [
    { studentId: "aarav", company: "Zoho", position: "Backend Intern", mode: "REMOTE" },
    { studentId: "diya", company: "Freshworks", position: "Full-stack Intern", mode: "REMOTE" },
    { studentId: "rohan", company: "TCS", position: "Data Analyst Intern", mode: "ONSITE" },
  ].map((i) => ({ id: id(), ...i, startDate: iso(start), endDate: iso(end) }));

  const attendance = [];
  const days = [];
  for (let d = start; d < today; d = addDays(d, 1)) if (!isWeekend(d)) days.push(d);
  [
    { studentId: "aarav", guide: "priya", skipEvery: 0, pendingLast: 2 },
    { studentId: "diya", guide: "priya", skipEvery: 6, pendingLast: 1 },
    { studentId: "rohan", guide: "arun", skipEvery: 2, pendingLast: 1 },
  ].forEach((plan) => {
    days.forEach((date, index) => {
      if (plan.skipEvery && index % plan.skipEvery === 1) return;
      const recent = index >= days.length - plan.pendingLast;
      attendance.push({
        id: id(),
        studentId: plan.studentId,
        date: iso(date),
        mode: index % 5 === 0 ? "ONSITE" : "REMOTE",
        summary: SUMMARIES[index % SUMMARIES.length],
        status: recent ? "PENDING" : "VERIFIED",
        remark: null,
        verifiedById: recent ? null : plan.guide,
        verifiedAt: recent ? null : iso(addDays(date, 1)),
        createdAt: iso(date),
      });
    });
  });

  const projects = [
    { id: "campus", title: "Smart Campus Attendance", description: "Geofenced attendance and analytics for SRM labs.", domain: "Web Development", status: "IN_PROGRESS", startDate: iso(start), deadline: iso(addDays(today, 42)), reviewRemark: null, proposedById: null, facultyId: "priya", progressPercentage: 45, createdAt: iso(start) },
    { id: "placement", title: "Placement Analytics", description: "Dashboard of placement trends across departments.", domain: "Data Science", status: "IN_PROGRESS", startDate: iso(start), deadline: iso(addDays(today, 10)), reviewRemark: null, proposedById: null, facultyId: "arun", progressPercentage: 20, createdAt: iso(start) },
    { id: "labtracker", title: "AI Lab Equipment Tracker", description: "Track lab equipment issue and return with QR codes and reminders.", domain: "AI / ML", status: "PROPOSED", startDate: iso(addDays(today, 3)), deadline: iso(addDays(today, 70)), reviewRemark: null, proposedById: "kavya", facultyId: "priya", progressPercentage: 0, createdAt: iso(addDays(today, -1)) },
    { id: "mess", title: "Hostel Mess Feedback App", description: "Mobile-first feedback for the hostel mess with weekly summaries.", domain: "Mobile", status: "COMPLETED", startDate: iso(addDays(today, -120)), deadline: iso(addDays(today, -30)), reviewRemark: null, proposedById: null, facultyId: "arun", progressPercentage: 100, createdAt: iso(addDays(today, -120)) },
  ];
  const teams = [
    { id: "alpha", name: "Team Alpha", projectId: "campus", leaderId: "aarav" },
    { id: "beta", name: "Team Beta", projectId: "placement", leaderId: "rohan" },
  ];
  const sub = (o) => ({ id: id(), link: null, feedback: null, reviewedAt: null, createdAt: iso(addDays(start, 7 * o.weekNumber - 2)), ...o });
  const submissions = [
    sub({ weekNumber: 1, title: "Project setup", description: "Set up the repo, database and auth endpoints.", status: "APPROVED", feedback: "Good start.", reviewedAt: iso(addDays(start, 8)), studentId: "aarav", projectId: "campus", link: "https://github.com/Parik022/Project_Portal" }),
    sub({ weekNumber: 2, title: "Attendance API", description: "Daily check-in endpoint with duplicate protection.", status: "CHANGES_REQUESTED", feedback: "Add tests for the duplicate check.", reviewedAt: iso(addDays(start, 15)), studentId: "aarav", projectId: "campus" }),
    sub({ weekNumber: 3, title: "Dashboard", description: "Built the faculty dashboard with live stats.", status: "PENDING", studentId: "aarav", projectId: "campus" }),
    sub({ weekNumber: 1, title: "UI wireframes", description: "Wireframes for student and faculty screens.", status: "APPROVED", reviewedAt: iso(addDays(start, 8)), studentId: "diya", projectId: "campus" }),
    sub({ weekNumber: 1, title: "Data collection", description: "Collected placement data for three years.", status: "PENDING", studentId: "rohan", projectId: "placement", createdAt: iso(addDays(start, 10)) }),
  ];
  const notifications = [
    { id: id(), userId: "admin", message: "Dr. Vikram Rao (faculty.pending@srmist.edu.in) registered as faculty and needs approval", type: "FACULTY_APPROVAL", isRead: false, createdAt: now() },
    { id: id(), userId: "priya", message: "Aarav Mehta submitted the week 3 report", type: "SUBMISSION_CREATED", isRead: false, createdAt: now() },
    { id: id(), userId: "priya", message: 'Kavya Nair proposed a project: "AI Lab Equipment Tracker"', type: "PROJECT_PROPOSED", isRead: false, createdAt: now() },
    { id: id(), userId: "aarav", message: "Changes requested on your week 2 report", type: "SUBMISSION_REVIEWED", isRead: false, createdAt: now() },
  ];

  return { seededOn: today, users, internships, attendance, projects, teams, submissions, notifications };
}

/* ------------------------------------------------------------------ */
/* Storage                                                              */
/* ------------------------------------------------------------------ */

let db;
const load = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    // Re-seed each day so the demo history always ends "yesterday".
    if (saved && saved.seededOn === ymdIST()) return saved;
  } catch {
    // storage unavailable: fall through to a fresh seed
  }
  return seed();
};
const save = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // demo still works for this tab without storage
  }
};
db = load();
save();

export const resetDemo = () => {
  db = seed();
  save();
};

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

class HttpError extends Error {
  constructor(status, message, errors = null) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}
const fail = (status, message, errors) => {
  throw new HttpError(status, message, errors);
};
const invalid = (errors) => fail(400, "Validation failed", errors);

const findUser = (uid) => db.users.find((x) => x.id === uid);
const pub = (x) => {
  if (!x) return null;
  const copy = { ...x };
  delete copy.password;
  return copy;
};
const brief = (x) => (x ? { id: x.id, name: x.name, email: x.email } : null);
const notify = (userIds, message, type) =>
  [].concat(userIds).filter(Boolean).forEach((userId) =>
    db.notifications.unshift({ id: id(), userId, message, type, isRead: false, createdAt: now() })
  );

const paginate = (items, query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return {
    items: items.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total: items.length, totalPages: Math.max(1, Math.ceil(items.length / limit)) },
  };
};

const studentsInScope = (actor) =>
  db.users.filter(
    (x) =>
      x.role === "STUDENT" &&
      (actor.role === "ADMIN" ||
        (actor.role === "HOD" && x.department === actor.department) ||
        (actor.role === "FACULTY" && x.guideId === actor.id) ||
        (actor.role === "STUDENT" && x.id === actor.id))
  );

const internshipOf = (sid) => db.internships.find((i) => i.studentId === sid) || null;

const summarize = (student) => {
  const recs = db.attendance.filter((a) => a.studentId === student.id);
  const count = (s) => recs.filter((a) => a.status === s).length;
  const verified = count("VERIFIED");
  const pending = count("PENDING");
  const internship = internshipOf(student.id);
  let days = 0;
  if (internship) {
    const today = ymdIST();
    const end = internship.endDate.slice(0, 10) < today ? internship.endDate.slice(0, 10) : today;
    days = workingDays(internship.startDate.slice(0, 10), end);
  }
  const percentage = days ? Math.min(100, Math.round((verified / days) * 100)) : 0;
  return {
    studentId: student.id,
    workingDays: days,
    present: verified,
    pending,
    rejected: count("REJECTED"),
    absent: Math.max(0, days - verified - pending),
    percentage,
    isLow: days > 0 && percentage < THRESHOLD,
    threshold: THRESHOLD,
  };
};

const studentSummary = (student) => {
  const today = ymdIST();
  return {
    ...summarize(student),
    internship: internshipOf(student.id),
    today: {
      date: today,
      isWeekend: isWeekend(today),
      record: db.attendance.find((a) => a.studentId === student.id && a.date === iso(today)) || null,
    },
  };
};

const scopeRows = (actor) =>
  studentsInScope(actor)
    .filter((x) => x.isActive)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((x) => {
      const last = db.submissions.filter((s) => s.studentId === x.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      return {
        id: x.id,
        name: x.name,
        email: x.email,
        registerNo: x.registerNo,
        department: x.department,
        internship: internshipOf(x.id),
        guide: brief(findUser(x.guideId)),
        lastReportAt: last?.createdAt ?? null,
        attendance: summarize(x),
      };
    });

const scopeStats = (actor) => {
  const rows = scopeRows(actor);
  const ids = new Set(studentsInScope(actor).map((x) => x.id));
  const working = rows.reduce((s, r) => s + r.attendance.workingDays, 0);
  const present = rows.reduce((s, r) => s + r.attendance.present, 0);
  return {
    students: rows.length,
    percentage: working ? Math.round((present / working) * 100) : 0,
    lowAttendance: rows.filter((r) => r.attendance.isLow).length,
    pendingVerification: db.attendance.filter((a) => ids.has(a.studentId) && a.status === "PENDING").length,
    checkedInToday: db.attendance.filter((a) => ids.has(a.studentId) && a.date === iso(ymdIST())).length,
    threshold: THRESHOLD,
  };
};

const attendanceView = (a) => ({
  ...a,
  student: (({ id: sid, name, email, registerNo }) => ({ id: sid, name, email, registerNo }))(findUser(a.studentId)),
  verifiedBy: a.verifiedById ? { id: a.verifiedById, name: findUser(a.verifiedById)?.name } : null,
});

const submissionScope = (actor, s) =>
  actor.role === "ADMIN" ||
  (actor.role === "STUDENT" && s.studentId === actor.id) ||
  (actor.role === "FACULTY" && db.projects.find((p) => p.id === s.projectId)?.facultyId === actor.id) ||
  (actor.role === "HOD" && findUser(s.studentId)?.department === actor.department);

const withDeadline = (s, p) => {
  const start = (p.startDate || p.createdAt).slice(0, 10);
  const dueDate = addDays(start, 7 * s.weekNumber - 1);
  return { dueDate, isLate: ymdIST(new Date(s.createdAt)) > dueDate };
};

const submissionView = (s) => {
  const st = findUser(s.studentId);
  const p = db.projects.find((x) => x.id === s.projectId);
  return {
    ...s,
    ...withDeadline(s, p),
    student: { id: st.id, name: st.name, email: st.email, registerNo: st.registerNo },
    project: { id: p.id, title: p.title, facultyId: p.facultyId },
  };
};

const membersOf = (teamId) => db.users.filter((x) => x.teamId === teamId).map(brief);
const leaderOf = (t) => (t.leaderId ? { id: t.leaderId, name: findUser(t.leaderId)?.name } : null);
const teamView = (t) => ({ ...t, project: (({ id: pid, title }) => ({ id: pid, title }))(db.projects.find((p) => p.id === t.projectId)), members: membersOf(t.id), leader: leaderOf(t) });
const projectView = (p) => {
  const teams = db.teams.filter((t) => t.projectId === p.id);
  return {
    ...p,
    faculty: brief(findUser(p.facultyId)),
    proposedBy: brief(findUser(p.proposedById)),
    teams: teams.map((t) => ({ ...t, members: membersOf(t.id), leader: leaderOf(t), _count: { members: membersOf(t.id).length } })),
    _count: { teams: teams.length, submissions: db.submissions.filter((s) => s.projectId === p.id).length },
  };
};

const userListView = (x) => ({
  ...pub(x),
  guide: x.guideId ? { id: x.guideId, name: findUser(x.guideId)?.name } : null,
  _count: { students: db.users.filter((s) => s.guideId === x.id).length },
});

const profileView = (x) => {
  const team = x.teamId ? db.teams.find((t) => t.id === x.teamId) : null;
  return {
    ...pub(x),
    guide: brief(findUser(x.guideId)),
    internship: internshipOf(x.id),
    team: team ? { ...team, project: db.projects.find((p) => p.id === team.projectId), members: membersOf(team.id) } : null,
  };
};

/* ------------------------------------------------------------------ */
/* Validation (same rules as backend/src/validators)                    */
/* ------------------------------------------------------------------ */

const checkPassword = (pw, errors, key = "password") => {
  if (!pw || pw.length < 8) errors[key] = ["Password must be at least 8 characters"];
  else if (!/[A-Za-z]/.test(pw)) errors[key] = ["Password must contain a letter"];
  else if (!/\d/.test(pw)) errors[key] = ["Password must contain a number"];
};
const checkEmail = (email, errors) => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "")) errors.email = ["Invalid email address"];
  else if (!email.endsWith(`@${DOMAIN}`)) errors.email = [`Use your @${DOMAIN} email address`];
};
const isUrl = (v) => {
  try {
    const parsed = new URL(v);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};
const done = (errors) => Object.keys(errors).length && invalid(errors);

/* ------------------------------------------------------------------ */
/* Routes                                                               */
/* ------------------------------------------------------------------ */

const routes = [];
const route = (method, pattern, roles, handler) => {
  const keys = [];
  const regex = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), "([^/]+)"))}$`);
  routes.push({ method, regex, keys, roles, handler });
};
const ANY = null;
const PUBLIC = "public";

// ---- auth
route("POST", "/auth/login", PUBLIC, ({ body }) => {
  const email = (body.email || "").trim().toLowerCase();
  const x = db.users.find((u) => u.email === email);
  if (!x || x.password !== body.password) fail(401, "Invalid email or password");
  if (!x.isActive) fail(403, x.role === "FACULTY" ? "Your faculty account is waiting for admin approval" : "Your account has been deactivated. Contact the admin.");
  return ["Login successful", { user: pub(x), token: `demo.${x.id}` }];
});

route("POST", "/auth/register", PUBLIC, ({ body }) => {
  const errors = {};
  const email = (body.email || "").trim().toLowerCase();
  if (!body.name || body.name.trim().length < 2) errors.name = ["Name must be at least 2 characters"];
  checkEmail(email, errors);
  checkPassword(body.password, errors);
  if (!["STUDENT", "FACULTY"].includes(body.role)) errors.role = ["Invalid role"];
  const registerNo = body.registerNo?.trim().toUpperCase();
  if (body.role === "STUDENT" && !/^RA\d{13}$/.test(registerNo || "")) errors.registerNo = ["Register number must look like RA2411030010438"];
  if (!body.department || body.department.trim().length < 2) errors.department = ["Department is required"];
  done(errors);
  if (db.users.some((u) => u.email === email)) fail(409, "Email already registered");
  if (registerNo && db.users.some((u) => u.registerNo === registerNo)) fail(409, "Register number already registered");
  const isFaculty = body.role === "FACULTY";
  const x = {
    id: id(),
    name: body.name.trim(),
    email,
    password: body.password,
    role: body.role,
    department: body.department.trim(),
    registerNo: isFaculty ? null : registerNo,
    isActive: !isFaculty,
    teamId: null,
    guideId: null,
    createdAt: now(),
  };
  db.users.push(x);
  if (isFaculty) {
    notify(db.users.filter((u) => u.role === "ADMIN").map((u) => u.id), `${x.name} (${x.email}) registered as faculty and needs approval`, "FACULTY_APPROVAL");
    return ["Registration received. An admin must approve faculty accounts before you can log in.", { user: pub(x), token: null }, 201];
  }
  return ["Registration successful", { user: pub(x), token: `demo.${x.id}` }, 201];
});

route("POST", "/auth/logout", ANY, () => ["Logged out", null]);
route("GET", "/auth/profile", ANY, ({ actor }) => ["Profile retrieved", profileView(actor)]);
route("PATCH", "/auth/profile", ANY, ({ actor, body }) => {
  const errors = {};
  if (body.name !== undefined && body.name.trim().length < 2) errors.name = ["Name must be at least 2 characters"];
  if (body.department !== undefined && body.department.trim().length < 2) errors.department = ["Department is required"];
  done(errors);
  if (body.name) actor.name = body.name.trim();
  if (body.department) actor.department = body.department.trim();
  return ["Profile updated", pub(actor)];
});
route("PATCH", "/auth/password", ANY, ({ actor, body }) => {
  const errors = {};
  checkPassword(body.newPassword, errors, "newPassword");
  if (body.currentPassword === body.newPassword) errors.newPassword = ["New password must be different"];
  done(errors);
  if (body.currentPassword !== actor.password) fail(400, "Current password is incorrect");
  actor.password = body.newPassword;
  return ["Password changed", { changed: true }];
});

// ---- internships
route("GET", "/internships/me", ["STUDENT"], ({ actor }) => ["Internship retrieved", internshipOf(actor.id)]);
route("PUT", "/internships/me", ["STUDENT"], ({ actor, body }) => {
  const errors = {};
  if (!body.company || body.company.trim().length < 2) errors.company = ["Company is required"];
  if (!body.position || body.position.trim().length < 2) errors.position = ["Position is required"];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.startDate || "")) errors.startDate = ["Date must be in YYYY-MM-DD format"];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.endDate || "")) errors.endDate = ["Date must be in YYYY-MM-DD format"];
  else if (body.endDate < body.startDate) errors.endDate = ["End date must be on or after start date"];
  done(errors);
  const values = { company: body.company.trim(), position: body.position.trim(), mode: body.mode || "REMOTE", startDate: iso(body.startDate), endDate: iso(body.endDate) };
  let i = internshipOf(actor.id);
  if (i) Object.assign(i, values);
  else db.internships.push((i = { id: id(), studentId: actor.id, ...values }));
  return ["Internship saved", i];
});

// ---- attendance
route("POST", "/attendance", ["STUDENT"], ({ actor, body }) => {
  const errors = {};
  if (!["ONSITE", "REMOTE"].includes(body.mode)) errors.mode = ["Choose remote or on-site"];
  if (!body.summary || body.summary.trim().length < 10) errors.summary = ["Describe today's work in at least 10 characters"];
  done(errors);
  const today = ymdIST();
  if (isWeekend(today)) fail(400, "Attendance is recorded Monday to Friday only");
  const internship = internshipOf(actor.id);
  if (!internship) fail(400, "Add your internship details before marking attendance");
  if (iso(today) < internship.startDate || iso(today) > internship.endDate) fail(400, "Today is outside your internship period");
  if (db.attendance.some((a) => a.studentId === actor.id && a.date === iso(today))) fail(409, "Attendance already marked for today");
  const record = { id: id(), studentId: actor.id, date: iso(today), mode: body.mode, summary: body.summary.trim(), status: "PENDING", remark: null, verifiedById: null, verifiedAt: null, createdAt: now() };
  db.attendance.push(record);
  notify(actor.guideId, `${actor.name} marked attendance for ${today}`, "ATTENDANCE_MARKED");
  return ["Attendance marked. Waiting for your guide to verify.", record, 201];
});

route("GET", "/attendance", ANY, ({ actor, query }) => {
  const ids = new Set(studentsInScope(actor).map((x) => x.id));
  const items = db.attendance
    .filter((a) => ids.has(a.studentId))
    .filter((a) => !query.studentId || a.studentId === query.studentId)
    .filter((a) => !query.status || a.status === query.status)
    .filter((a) => !query.from || a.date >= iso(query.from))
    .filter((a) => !query.to || a.date <= iso(query.to))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .map(attendanceView);
  return ["Attendance records retrieved", paginate(items, query)];
});

route("GET", "/attendance/stats", ANY, ({ actor }) => [
  "Attendance stats retrieved",
  actor.role === "STUDENT" ? studentSummary(actor) : scopeStats(actor),
]);

route("GET", "/attendance/report", ["FACULTY", "HOD", "ADMIN"], ({ actor, query }) => {
  const rows = scopeRows(actor);
  if (query.format === "csv") {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      "Name,Register No,Email,Department,Guide,Working days,Present,Pending,Absent,Attendance %",
      ...rows.map((r) =>
        [r.name, r.registerNo, r.email, r.department, r.guide?.name, r.attendance.workingDays, r.attendance.present, r.attendance.pending, r.attendance.absent, r.attendance.percentage].map(esc).join(",")
      ),
    ].join("\n");
    return { raw: new Blob([csv], { type: "text/csv" }) };
  }
  return ["Attendance report retrieved", rows];
});

route("PATCH", "/attendance/:id/verify", ["FACULTY", "ADMIN"], ({ actor, params, body }) => {
  const errors = {};
  if (!["VERIFIED", "REJECTED"].includes(body.status)) errors.status = ["Invalid status"];
  if (body.status === "REJECTED" && (!body.remark || body.remark.trim().length < 3)) errors.remark = ["Give a reason when rejecting attendance"];
  done(errors);
  const a = db.attendance.find((x) => x.id === params.id);
  if (!a) fail(404, "Attendance record not found");
  if (actor.role === "FACULTY" && findUser(a.studentId).guideId !== actor.id) fail(403, "Only the student's assigned guide can verify this record");
  Object.assign(a, { status: body.status, remark: body.remark?.trim() || null, verifiedById: actor.id, verifiedAt: now() });
  const day = a.date.slice(0, 10);
  notify(a.studentId, body.status === "VERIFIED" ? `Your attendance for ${day} was verified` : `Your attendance for ${day} was rejected: ${a.remark}`, "ATTENDANCE_REVIEWED");
  return [`Attendance ${a.status.toLowerCase()}`, attendanceView(a)];
});

// ---- submissions
route("GET", "/submissions", ANY, ({ actor }) => [
  "Submissions retrieved",
  db.submissions
    .filter((s) => submissionScope(actor, s))
    .sort((a, b) => (actor.role === "STUDENT" ? b.weekNumber - a.weekNumber : b.createdAt.localeCompare(a.createdAt)))
    .map(submissionView),
]);

route("POST", "/submissions", ["STUDENT"], ({ actor, body }) => {
  const errors = {};
  if (!Number.isInteger(body.weekNumber) || body.weekNumber < 1 || body.weekNumber > 52) errors.weekNumber = ["Week number must be between 1 and 52"];
  if (!body.title || body.title.trim().length < 2) errors.title = ["Title must be at least 2 characters"];
  if (!body.description || body.description.trim().length < 5) errors.description = ["Description must be at least 5 characters"];
  if (body.link && !isUrl(body.link)) errors.link = ["Link must be a valid URL"];
  done(errors);
  const team = db.teams.find((t) => t.id === actor.teamId);
  if (!team) fail(400, "You must be assigned to a team before submitting");
  const teamProject = db.projects.find((p) => p.id === team.projectId);
  if (!["APPROVED", "IN_PROGRESS"].includes(teamProject.status)) fail(400, "Reports can be submitted once your project is approved");
  if (db.submissions.some((s) => s.studentId === actor.id && s.weekNumber === body.weekNumber)) fail(409, "You already submitted a report for this week");
  const s = { id: id(), weekNumber: body.weekNumber, title: body.title.trim(), description: body.description.trim(), link: body.link || null, status: "PENDING", feedback: null, reviewedAt: null, studentId: actor.id, projectId: team.projectId, createdAt: now() };
  db.submissions.push(s);
  notify(db.projects.find((p) => p.id === team.projectId).facultyId, `${actor.name} submitted the week ${s.weekNumber} report`, "SUBMISSION_CREATED");
  return ["Report submitted", submissionView(s), 201];
});

route("PATCH", "/submissions/:id", ["STUDENT"], ({ actor, params, body }) => {
  const s = db.submissions.find((x) => x.id === params.id && x.studentId === actor.id);
  if (!s) fail(404, "Submission not found");
  if (s.status === "APPROVED") fail(400, "Approved reports can no longer be edited");
  const errors = {};
  if (body.title !== undefined && body.title.trim().length < 2) errors.title = ["Title must be at least 2 characters"];
  if (body.description !== undefined && body.description.trim().length < 5) errors.description = ["Description must be at least 5 characters"];
  if (body.link && !isUrl(body.link)) errors.link = ["Link must be a valid URL"];
  done(errors);
  const wasChanges = s.status === "CHANGES_REQUESTED";
  Object.assign(s, { ...(body.title ? { title: body.title.trim() } : {}), ...(body.description ? { description: body.description.trim() } : {}), ...(body.link !== undefined ? { link: body.link } : {}), status: "PENDING" });
  if (wasChanges) notify(db.projects.find((p) => p.id === s.projectId).facultyId, `${actor.name} resubmitted the week ${s.weekNumber} report`, "SUBMISSION_RESUBMITTED");
  return ["Report updated", submissionView(s)];
});

route("PATCH", "/submissions/:id/review", ["FACULTY", "ADMIN"], ({ actor, params, body }) => {
  const errors = {};
  if (!["APPROVED", "CHANGES_REQUESTED"].includes(body.status)) errors.status = ["Invalid status"];
  if (body.status === "CHANGES_REQUESTED" && (!body.feedback || body.feedback.trim().length < 5)) errors.feedback = ["Explain what needs to change"];
  done(errors);
  const s = db.submissions.find((x) => x.id === params.id);
  if (!s || (actor.role === "FACULTY" && db.projects.find((p) => p.id === s.projectId)?.facultyId !== actor.id)) fail(404, "Submission not found or access denied");
  Object.assign(s, { status: body.status, feedback: body.feedback?.trim() || null, reviewedAt: now() });
  notify(s.studentId, body.status === "APPROVED" ? `Your week ${s.weekNumber} report was approved` : `Changes requested on your week ${s.weekNumber} report`, "SUBMISSION_REVIEWED");
  return ["Report reviewed", submissionView(s)];
});

// ---- projects
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const projectScope = (actor) => (p) => {
  if (actor.role === "FACULTY") return p.facultyId === actor.id;
  if (actor.role === "HOD") return findUser(p.facultyId)?.department === actor.department;
  if (actor.role === "ADMIN") return true;
  const team = db.teams.find((t) => t.id === actor.teamId);
  return p.proposedById === actor.id || (team && team.projectId === p.id);
};
const checkProject = (body, partial) => {
  const errors = {};
  const has = (k) => !partial || body[k] !== undefined;
  if (has("title") && (!body.title || body.title.trim().length < 2)) errors.title = ["Title must be at least 2 characters"];
  if (has("description") && (!body.description || body.description.trim().length < 5)) errors.description = ["Description must be at least 5 characters"];
  if (has("domain") && (!body.domain || body.domain.trim().length < 2)) errors.domain = ["Pick a domain"];
  ["startDate", "deadline"].forEach((k) => body[k] && !DATE_RE.test(body[k]) && (errors[k] = ["Date must be in YYYY-MM-DD format"]));
  if (body.startDate && body.deadline && body.deadline < body.startDate) errors.deadline = ["Deadline must be on or after the start date"];
  done(errors);
};
const dateValues = (body) => ({
  ...(body.startDate !== undefined ? { startDate: body.startDate ? iso(body.startDate) : null } : {}),
  ...(body.deadline !== undefined ? { deadline: body.deadline ? iso(body.deadline) : null } : {}),
});
const manageable = (actor, pid) =>
  db.projects.find((p) => p.id === pid && (actor.role === "ADMIN" || p.facultyId === actor.id)) || fail(404, "Project not found or access denied");

route("GET", "/projects", ANY, ({ actor, query }) => {
  const scoped = db.projects.filter(projectScope(actor));
  const q = (query.search || "").toLowerCase();
  const sort = query.sort || "createdAt";
  const dir = query.order === "asc" ? 1 : -1;
  const list = scoped
    .filter((p) => !query.status || p.status === query.status)
    .filter((p) => !query.domain || p.domain === query.domain)
    .filter((p) => !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    .sort((a, b) => {
      if (sort === "deadline") {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
      }
      const va = a[sort];
      const vb = b[sort];
      return (typeof va === "number" ? va - vb : String(va).localeCompare(String(vb))) * dir || b.createdAt.localeCompare(a.createdAt);
    })
    .map(projectView);
  return ["Projects retrieved", { ...paginate(list, { ...query, limit: query.limit || 12 }), domains: [...new Set(scoped.map((p) => p.domain))].sort() }];
});

route("GET", "/projects/:id", ANY, ({ actor, params }) => {
  const p = db.projects.find((x) => x.id === params.id && projectScope(actor)(x)) || fail(404, "Project not found");
  const submissions = db.submissions
    .filter((s) => s.projectId === p.id && (actor.role !== "STUDENT" || s.studentId === actor.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10)
    .map((s) => ({ ...s, ...withDeadline(s, p), student: brief(findUser(s.studentId)) }));
  return ["Project retrieved", { ...projectView(p), submissions }];
});

route("POST", "/projects", ["FACULTY"], ({ actor, body }) => {
  checkProject(body);
  const p = { id: id(), title: body.title.trim(), description: body.description.trim(), domain: body.domain, status: "APPROVED", startDate: null, deadline: null, ...dateValues(body), reviewRemark: null, proposedById: null, progressPercentage: Number(body.progressPercentage) || 0, facultyId: actor.id, createdAt: now() };
  db.projects.push(p);
  return ["Project created", projectView(p), 201];
});

route("POST", "/projects/proposals", ["STUDENT"], ({ actor, body }) => {
  checkProject(body);
  const f = findUser(body.facultyId);
  if (!f || f.role !== "FACULTY" || !f.isActive) invalid({ facultyId: ["Choose an active faculty member"] });
  if (db.projects.some((p) => p.proposedById === actor.id && p.status === "PROPOSED")) fail(409, "You already have a proposal waiting for review");
  const p = { id: id(), title: body.title.trim(), description: body.description.trim(), domain: body.domain, status: "PROPOSED", startDate: null, deadline: null, ...dateValues(body), reviewRemark: null, proposedById: actor.id, progressPercentage: 0, facultyId: f.id, createdAt: now() };
  db.projects.push(p);
  notify(f.id, `${actor.name} proposed a project: "${p.title}"`, "PROJECT_PROPOSED");
  return ["Proposal sent to faculty", projectView(p), 201];
});

route("PATCH", "/projects/:id/review", ["FACULTY", "ADMIN"], ({ actor, params, body }) => {
  if (!["APPROVED", "REJECTED"].includes(body.decision)) invalid({ decision: ["Invalid decision"] });
  if (body.decision === "REJECTED" && (!body.remark || body.remark.trim().length < 5)) invalid({ remark: ["Explain why the proposal is rejected"] });
  const p = manageable(actor, params.id);
  if (p.status !== "PROPOSED") fail(400, "Only proposals waiting for review can be approved or rejected");
  p.status = body.decision;
  p.reviewRemark = body.remark?.trim() || null;
  const proposer = findUser(p.proposedById);
  if (body.decision === "APPROVED" && proposer && !proposer.teamId) {
    const t = { id: id(), name: `${p.title} Team`, projectId: p.id, leaderId: proposer.id };
    db.teams.push(t);
    proposer.teamId = t.id;
  }
  notify(p.proposedById, body.decision === "APPROVED" ? `Your project "${p.title}" was approved` : `Your project "${p.title}" was rejected: ${p.reviewRemark}`, "PROJECT_REVIEWED");
  return [body.decision === "APPROVED" ? "Proposal approved" : "Proposal rejected", projectView(p)];
});

const updateProjectRoute = ({ actor, params, body }) => {
  checkProject(body, true);
  const p = manageable(actor, params.id);
  if (body.status && ["PROPOSED", "REJECTED"].includes(p.status)) fail(400, "Review the proposal before changing its status");
  if (body.status && !["APPROVED", "IN_PROGRESS", "COMPLETED"].includes(body.status)) invalid({ status: ["Invalid status"] });
  const { startDate, deadline, ...rest } = body;
  Object.assign(p, rest, dateValues({ startDate, deadline }));
  if (body.progressPercentage !== undefined) p.progressPercentage = Number(body.progressPercentage);
  if (body.status === "COMPLETED") p.progressPercentage = 100;
  return ["Project updated", projectView(p)];
};
route("PATCH", "/projects/:id", ["FACULTY", "ADMIN"], updateProjectRoute);
route("PUT", "/projects/:id", ["FACULTY", "ADMIN"], updateProjectRoute);

route("PATCH", "/projects/:id/faculty", ["ADMIN"], ({ params, body }) => {
  const f = findUser(body.facultyId);
  if (!f || f.role !== "FACULTY" || !f.isActive) fail(400, "Choose an active faculty member");
  const p = db.projects.find((x) => x.id === params.id) || fail(404, "Project not found");
  p.facultyId = f.id;
  notify(f.id, `You are now the faculty for "${p.title}"`, "PROJECT_ASSIGNED");
  return ["Faculty assigned", projectView(p)];
});

route("DELETE", "/projects/:id", ["FACULTY", "ADMIN"], ({ actor, params }) => {
  manageable(actor, params.id);
  const teamIds = db.teams.filter((t) => t.projectId === params.id).map((t) => t.id);
  db.users.forEach((x) => teamIds.includes(x.teamId) && (x.teamId = null));
  db.teams = db.teams.filter((t) => t.projectId !== params.id);
  db.submissions = db.submissions.filter((s) => s.projectId !== params.id);
  db.projects = db.projects.filter((p) => p.id !== params.id);
  return ["Project deleted", { message: "Project deleted successfully" }];
});

const ownProject = (actor, pid) =>
  db.projects.find((p) => p.id === pid && p.facultyId === actor.id) || fail(404, "Project not found or access denied");

// ---- teams
route("GET", "/teams", ANY, ({ actor }) => {
  if (actor.role === "STUDENT") {
    const team = db.teams.find((t) => t.id === actor.teamId);
    if (!team) fail(404, "You are not assigned to a team yet");
    const p = db.projects.find((x) => x.id === team.projectId);
    return ["Team retrieved", { ...team, project: { ...p, faculty: brief(findUser(p.facultyId)) }, members: membersOf(team.id), leader: leaderOf(team) }];
  }
  const list = db.teams.filter((t) => {
    const p = db.projects.find((x) => x.id === t.projectId);
    if (actor.role === "FACULTY") return p.facultyId === actor.id;
    if (actor.role === "HOD") return findUser(p.facultyId)?.department === actor.department;
    return true;
  });
  return ["Teams retrieved", list.sort((a, b) => a.name.localeCompare(b.name)).map(teamView)];
});
route("GET", "/teams/available-students", ["FACULTY", "ADMIN"], () => [
  "Available students retrieved",
  db.users.filter((x) => x.role === "STUDENT" && x.isActive && !x.teamId).map((x) => ({ id: x.id, name: x.name, email: x.email, registerNo: x.registerNo, department: x.department })),
]);
route("POST", "/teams", ["FACULTY"], ({ actor, body }) => {
  if (!body.name || body.name.trim().length < 2) invalid({ name: ["Team name must be at least 2 characters"] });
  const project = ownProject(actor, body.projectId);
  if (["PROPOSED", "REJECTED"].includes(project.status)) fail(400, "Teams can only be created for approved projects");
  const t = { id: id(), name: body.name.trim(), projectId: body.projectId, leaderId: null };
  db.teams.push(t);
  return ["Team created", teamView(t), 201];
});
route("POST", "/teams/assign", ["FACULTY"], ({ actor, body }) => {
  const t = db.teams.find((x) => x.id === body.teamId) || fail(404, "Team not found");
  ownProject(actor, t.projectId);
  const st = findUser(body.studentId);
  if (!st || st.role !== "STUDENT") fail(404, "Student not found");
  if (st.teamId === t.id) fail(409, "Student is already in this team");
  if (st.teamId) fail(409, "Student already belongs to another team");
  if (membersOf(t.id).length >= MAX_TEAM_SIZE) fail(400, `A team can have at most ${MAX_TEAM_SIZE} members`);
  st.teamId = t.id;
  return ["Student assigned to team", pub(st)];
});
route("DELETE", "/teams/:id/members/:studentId", ["FACULTY"], ({ actor, params }) => {
  const t = db.teams.find((x) => x.id === params.id) || fail(404, "Team not found");
  ownProject(actor, t.projectId);
  const st = db.users.find((x) => x.id === params.studentId && x.teamId === t.id) || fail(404, "Student is not in this team");
  st.teamId = null;
  if (t.leaderId === st.id) t.leaderId = null;
  return ["Student removed from team", { removed: true }];
});
const manageableTeam = (actor, tid) => {
  const t = db.teams.find((x) => x.id === tid) || fail(404, "Team not found");
  if (actor.role === "FACULTY") ownProject(actor, t.projectId);
  return t;
};
route("PATCH", "/teams/:id", ["FACULTY", "ADMIN"], ({ actor, params, body }) => {
  const t = manageableTeam(actor, params.id);
  if (body.name !== undefined && body.name.trim().length < 2) invalid({ name: ["Team name must be at least 2 characters"] });
  if (body.leaderId && !db.users.some((x) => x.id === body.leaderId && x.teamId === t.id)) fail(400, "The leader must be a member of this team");
  if (body.name) t.name = body.name.trim();
  if (body.leaderId !== undefined) t.leaderId = body.leaderId;
  if (body.leaderId) notify(body.leaderId, `You are now the leader of ${t.name}`, "TEAM_LEADER");
  return ["Team updated", teamView(t)];
});
route("DELETE", "/teams/:id", ["FACULTY", "ADMIN"], ({ actor, params }) => {
  manageableTeam(actor, params.id);
  db.users.forEach((x) => x.teamId === params.id && (x.teamId = null));
  db.teams = db.teams.filter((t) => t.id !== params.id);
  return ["Team deleted", { deleted: true }];
});

// ---- users
route("GET", "/users/faculty", ANY, () => [
  "Faculty retrieved",
  db.users.filter((x) => x.role === "FACULTY" && x.isActive).sort((a, b) => a.name.localeCompare(b.name)).map((x) => ({ id: x.id, name: x.name, department: x.department })),
]);
const usersInScope = (actor) => db.users.filter((x) => actor.role === "ADMIN" || x.department === actor.department);
route("GET", "/users", ["ADMIN", "HOD"], ({ actor, query }) => {
  const q = (query.search || "").toLowerCase();
  const order = { ADMIN: 0, FACULTY: 1, HOD: 2, STUDENT: 3 };
  const items = usersInScope(actor)
    .filter((x) => !query.role || x.role === query.role)
    .filter((x) => query.isActive === undefined || String(x.isActive) === query.isActive)
    .filter((x) => !q || [x.name, x.email, x.registerNo].some((v) => v?.toLowerCase().includes(q)))
    .sort((a, b) => order[a.role] - order[b.role] || a.name.localeCompare(b.name))
    .map(userListView);
  return ["Users retrieved", paginate(items, query)];
});
route("POST", "/users", ["ADMIN"], ({ body }) => {
  const errors = {};
  const email = (body.email || "").trim().toLowerCase();
  if (!body.name || body.name.trim().length < 2) errors.name = ["Name must be at least 2 characters"];
  checkEmail(email, errors);
  checkPassword(body.password, errors);
  if (!body.department || body.department.trim().length < 2) errors.department = ["Department is required"];
  done(errors);
  if (db.users.some((u) => u.email === email)) fail(409, "Email already registered");
  const x = { id: id(), name: body.name.trim(), email, password: body.password, role: body.role, department: body.department.trim(), registerNo: body.role === "STUDENT" ? body.registerNo || null : null, isActive: true, teamId: null, guideId: null, createdAt: now() };
  db.users.push(x);
  return ["User created", pub(x), 201];
});
route("PATCH", "/users/:id", ["ADMIN"], ({ actor, params, body }) => {
  const x = findUser(params.id) || fail(404, "User not found");
  if (x.id === actor.id && (body.isActive === false || (body.role && body.role !== "ADMIN"))) fail(400, "You cannot deactivate or demote your own account");
  const wasInactive = !x.isActive;
  Object.assign(x, body);
  if (body.isActive === true && wasInactive) notify(x.id, "Your account has been approved. You can now log in.", "ACCOUNT_APPROVED");
  return ["User updated", pub(x)];
});
route("PATCH", "/users/:id/guide", ["ADMIN"], ({ params, body }) => {
  const st = findUser(params.id);
  if (!st || st.role !== "STUDENT") fail(404, "Student not found");
  if (body.guideId) {
    const g = findUser(body.guideId);
    if (!g || g.role !== "FACULTY" || !g.isActive) fail(400, "Guide must be an active faculty member");
  }
  st.guideId = body.guideId || null;
  if (st.guideId) {
    notify(st.guideId, `${st.name} has been assigned to you as an internship student`, "GUIDE_ASSIGNED");
    notify(st.id, `${findUser(st.guideId).name} is now your internship guide`, "GUIDE_ASSIGNED");
  }
  return ["Guide assigned", userListView(st)];
});
route("DELETE", "/users/:id", ["ADMIN"], ({ actor, params }) => {
  if (params.id === actor.id) fail(400, "You cannot deactivate or demote your own account");
  const x = findUser(params.id) || fail(404, "User not found");
  x.isActive = false;
  return ["User deactivated", pub(x)];
});

// ---- notifications
route("GET", "/notifications", ANY, ({ actor, query }) => {
  const mine = db.notifications.filter((n) => n.userId === actor.id);
  const list = query.unread === "true" ? mine.filter((n) => !n.isRead) : mine;
  return ["Notifications retrieved", { ...paginate(list, query), unreadCount: mine.filter((n) => !n.isRead).length }];
});
route("PATCH", "/notifications/read-all", ANY, ({ actor }) => {
  let updated = 0;
  db.notifications.forEach((n) => n.userId === actor.id && !n.isRead && ((n.isRead = true), updated++));
  return ["All notifications marked as read", { updated }];
});
route("PATCH", "/notifications/:id/read", ANY, ({ actor, params }) => {
  const n = db.notifications.find((x) => x.id === params.id && x.userId === actor.id) || fail(404, "Notification not found");
  n.isRead = true;
  return ["Notification marked as read", n];
});
route("DELETE", "/notifications/:id", ANY, ({ actor, params }) => {
  db.notifications.find((x) => x.id === params.id && x.userId === actor.id) || fail(404, "Notification not found");
  db.notifications = db.notifications.filter((x) => x.id !== params.id);
  return ["Notification deleted", { deleted: true }];
});

// ---- dashboard
route("GET", "/dashboard", ANY, ({ actor }) => {
  const recent = (pred) =>
    db.submissions.filter(pred).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map(submissionView);

  if (actor.role === "STUDENT") {
    const profile = profileView(actor);
    const team = profile.team;
    const project = team ? { ...team.project, faculty: brief(findUser(team.project.facultyId)) } : null;
    const mine = db.submissions.filter((s) => s.studentId === actor.id);
    const attendance = studentSummary(actor);
    return ["Dashboard retrieved", {
      role: "STUDENT",
      assignedProject: project,
      team: team ? { id: team.id, name: team.name, members: team.members } : null,
      guide: profile.guide,
      stats: { submissionCount: mine.length, pendingReviews: mine.filter((s) => s.status === "PENDING").length, attendancePercentage: attendance.percentage },
      attendance,
      recentSubmissions: [...mine].sort((a, b) => b.weekNumber - a.weekNumber).slice(0, 5),
    }];
  }

  if (actor.role === "FACULTY") {
    const projects = db.projects.filter((p) => p.facultyId === actor.id && !["PROPOSED", "REJECTED"].includes(p.status));
    const pids = new Set(projects.map((p) => p.id));
    const stats = scopeStats(actor);
    return ["Dashboard retrieved", {
      role: "FACULTY",
      stats: {
        totalProjects: projects.length,
        totalTeams: db.teams.filter((t) => pids.has(t.projectId)).length,
        guidedStudents: stats.students,
        pendingReviews: db.submissions.filter((s) => pids.has(s.projectId) && s.status === "PENDING").length,
        pendingAttendance: stats.pendingVerification,
        pendingProposals: db.projects.filter((p) => p.facultyId === actor.id && p.status === "PROPOSED").length,
        attendancePercentage: stats.percentage,
      },
      attendanceStats: stats,
      students: scopeRows(actor),
      recentSubmissions: recent((s) => pids.has(s.projectId)),
      projectProgress: projects.map((p) => ({ id: p.id, title: p.title, progressPercentage: p.progressPercentage })),
    }];
  }

  if (actor.role === "HOD") {
    const stats = scopeStats(actor);
    const inDept = (s) => findUser(s.studentId)?.department === actor.department;
    return ["Dashboard retrieved", {
      role: "HOD",
      department: actor.department,
      stats: {
        students: stats.students,
        facultyCount: db.users.filter((x) => x.role === "FACULTY" && x.isActive && x.department === actor.department).length,
        attendancePercentage: stats.percentage,
        lowAttendance: stats.lowAttendance,
        checkedInToday: stats.checkedInToday,
        pendingReviews: db.submissions.filter((s) => inDept(s) && s.status === "PENDING").length,
      },
      attendanceStats: stats,
      students: scopeRows(actor),
      recentSubmissions: recent(inDept),
    }];
  }

  const active = db.users.filter((x) => x.isActive);
  const count = (role) => active.filter((x) => x.role === role).length;
  const pendingFaculty = db.users.filter((x) => x.role === "FACULTY" && !x.isActive).map((x) => ({ id: x.id, name: x.name, email: x.email, department: x.department, createdAt: x.createdAt }));
  const stats = scopeStats(actor);
  return ["Dashboard retrieved", {
    role: "ADMIN",
    stats: {
      students: count("STUDENT"),
      faculty: count("FACULTY"),
      hods: count("HOD"),
      admins: count("ADMIN"),
      pendingFacultyApprovals: pendingFaculty.length,
      unassignedStudents: active.filter((x) => x.role === "STUDENT" && !x.guideId).length,
      totalProjects: db.projects.filter((p) => !["PROPOSED", "REJECTED"].includes(p.status)).length,
      attendancePercentage: stats.percentage,
    },
    pendingFaculty,
    attendanceStats: stats,
  }];
});

/* ------------------------------------------------------------------ */
/* Dispatcher                                                           */
/* ------------------------------------------------------------------ */

// Handles one request the way the Express app would. Returns { status, body }.
export function handle(method, url, body, token) {
  const [rawPath, search = ""] = url.split("?");
  const path = rawPath.replace(/^\/api(\/v1)?/, "") || "/";
  const query = Object.fromEntries(new URLSearchParams(search));

  try {
    const match = routes.find((r) => r.method === method && r.regex.test(path));
    if (!match) fail(404, `Route ${method} ${path} not found`);

    let actor = null;
    if (match.roles !== PUBLIC) {
      const uid = token?.startsWith("demo.") ? token.slice(5) : null;
      actor = uid ? findUser(uid) : null;
      if (!actor) fail(401, "Authentication required");
      if (!actor.isActive) fail(403, "Your account is inactive");
      if (match.roles && !match.roles.includes(actor.role)) fail(403, "You do not have permission to perform this action");
    }

    const values = path.match(match.regex).slice(1);
    const params = Object.fromEntries(match.keys.map((k, i) => [k, decodeURIComponent(values[i])]));
    const result = match.handler({ actor, params, query, body: body || {} });
    save();

    if (result?.raw) return { status: 200, raw: result.raw };
    const [message, data, status = 200] = result;
    return { status, body: { success: true, message, data } };
  } catch (error) {
    if (error instanceof HttpError) {
      return { status: error.status, body: { success: false, message: error.message, errors: error.errors } };
    }
    console.error(error);
    return { status: 500, body: { success: false, message: "Internal server error", errors: null } };
  }
}
