require("dotenv").config();
const bcrypt = require("bcryptjs");
const { prisma } = require("../src/config/database");
const { todayIST, countWorkingDays, isWeekend } = require("../src/utils/date");

const PASSWORD = "Password123";

const addDays = (date, days) => {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
};

// Weekdays from start up to (not including) today.
const pastWorkingDays = (start, today) => {
  const days = [];
  for (let d = new Date(start); d < today; d = addDays(d, 1)) {
    if (!isWeekend(d)) days.push(new Date(d));
  }
  return days;
};

const SUMMARIES = [
  "Worked on REST endpoints and fixed validation bugs",
  "Attended sprint planning and wrote unit tests",
  "Built a dashboard page and connected it to the API",
  "Reviewed pull requests and refactored the service layer",
  "Researched caching options and documented findings",
];

async function main() {
  await prisma.notification.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.internship.deleteMany();
  await prisma.user.updateMany({ data: { teamId: null, guideId: null } });
  await prisma.team.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash(PASSWORD, 12);
  const user = (data) => prisma.user.create({ data: { password, department: "CSE", ...data } });

  const admin = await user({ name: "Portal Admin", email: "admin@srmist.edu.in", role: "ADMIN" });
  const hod = await user({ name: "Dr. Meena Krishnan", email: "hod.cse@srmist.edu.in", role: "HOD" });
  const priya = await user({ name: "Dr. Priya Raman", email: "faculty1@srmist.edu.in", role: "FACULTY" });
  const arun = await user({ name: "Dr. Arun Kumar", email: "faculty2@srmist.edu.in", role: "FACULTY" });
  await user({ name: "Dr. Vikram Rao", email: "faculty.pending@srmist.edu.in", role: "FACULTY", isActive: false });

  const aarav = await user({ name: "Aarav Mehta", email: "student1@srmist.edu.in", role: "STUDENT", registerNo: "RA2411030010001", guideId: priya.id });
  const diya = await user({ name: "Diya Sharma", email: "student2@srmist.edu.in", role: "STUDENT", registerNo: "RA2411030010002", guideId: priya.id });
  const rohan = await user({ name: "Rohan Iyer", email: "student3@srmist.edu.in", role: "STUDENT", registerNo: "RA2411030010003", guideId: arun.id });
  await user({ name: "Kavya Nair", email: "student4@srmist.edu.in", role: "STUDENT", registerNo: "RA2411030010004" });

  const today = todayIST();
  const start = addDays(today, -28);
  const end = addDays(today, 56);

  const internships = [
    { student: aarav, company: "Zoho", position: "Backend Intern", mode: "REMOTE" },
    { student: diya, company: "Freshworks", position: "Full-stack Intern", mode: "REMOTE" },
    { student: rohan, company: "TCS", position: "Data Analyst Intern", mode: "ONSITE" },
  ];
  for (const i of internships) {
    await prisma.internship.create({
      data: { studentId: i.student.id, company: i.company, position: i.position, mode: i.mode, startDate: start, endDate: end },
    });
  }

  // Attendance history: Aarav ~95%, Diya ~85%, Rohan ~55% (shows the low-attendance flag).
  const days = pastWorkingDays(start, today);
  const plans = [
    { student: aarav, guide: priya, skipEvery: 0, pendingLast: 2 },
    { student: diya, guide: priya, skipEvery: 6, pendingLast: 1 },
    { student: rohan, guide: arun, skipEvery: 2, pendingLast: 1 },
  ];
  for (const plan of plans) {
    const records = [];
    days.forEach((date, index) => {
      if (plan.skipEvery && index % plan.skipEvery === 1) return; // missed day
      const isRecent = index >= days.length - plan.pendingLast;
      records.push({
        studentId: plan.student.id,
        date,
        mode: index % 5 === 0 ? "ONSITE" : "REMOTE",
        summary: SUMMARIES[index % SUMMARIES.length],
        status: isRecent ? "PENDING" : "VERIFIED",
        verifiedById: isRecent ? null : plan.guide.id,
        verifiedAt: isRecent ? null : addDays(date, 1),
      });
    });
    await prisma.attendance.createMany({ data: records });
  }

  const campus = await prisma.project.create({
    data: {
      title: "Smart Campus Attendance",
      description: "Geofenced attendance and analytics for SRM labs.",
      facultyId: priya.id,
      progressPercentage: 45,
    },
  });
  const placement = await prisma.project.create({
    data: {
      title: "Placement Analytics",
      description: "Dashboard of placement trends across departments.",
      facultyId: arun.id,
      progressPercentage: 20,
    },
  });

  const alpha = await prisma.team.create({ data: { name: "Team Alpha", projectId: campus.id } });
  const beta = await prisma.team.create({ data: { name: "Team Beta", projectId: placement.id } });
  await prisma.user.updateMany({ where: { id: { in: [aarav.id, diya.id] } }, data: { teamId: alpha.id } });
  await prisma.user.update({ where: { id: rohan.id }, data: { teamId: beta.id } });

  await prisma.submission.createMany({
    data: [
      { weekNumber: 1, title: "Week 1: Setup", description: "Set up the repo, database and auth endpoints.", status: "APPROVED", feedback: "Good start.", reviewedAt: addDays(start, 8), studentId: aarav.id, projectId: campus.id, link: "https://github.com/example/smart-campus" },
      { weekNumber: 2, title: "Week 2: Attendance API", description: "Daily check-in endpoint with duplicate protection.", status: "CHANGES_REQUESTED", feedback: "Add tests for the duplicate check.", reviewedAt: addDays(start, 15), studentId: aarav.id, projectId: campus.id },
      { weekNumber: 3, title: "Week 3: Dashboard", description: "Built the faculty dashboard with live stats.", status: "PENDING", studentId: aarav.id, projectId: campus.id },
      { weekNumber: 1, title: "Week 1: UI wireframes", description: "Wireframes for student and faculty screens.", status: "APPROVED", reviewedAt: addDays(start, 8), studentId: diya.id, projectId: campus.id },
      { weekNumber: 1, title: "Week 1: Data collection", description: "Collected placement data for three years.", status: "PENDING", studentId: rohan.id, projectId: placement.id },
    ],
  });

  await prisma.notification.createMany({
    data: [
      { userId: admin.id, message: "Dr. Vikram Rao (faculty.pending@srmist.edu.in) registered as faculty and needs approval", type: "FACULTY_APPROVAL" },
      { userId: priya.id, message: "Aarav Mehta submitted the week 3 report", type: "SUBMISSION_CREATED" },
      { userId: aarav.id, message: "Changes requested on your week 2 report", type: "SUBMISSION_REVIEWED" },
    ],
  });

  console.log(`Seed completed (${countWorkingDays(start, addDays(today, -1))} past working days of attendance).`);
  console.log(`All accounts use password: ${PASSWORD}`);
  console.table([
    { role: "ADMIN", email: admin.email },
    { role: "HOD (CSE)", email: hod.email },
    { role: "FACULTY", email: priya.email },
    { role: "FACULTY", email: arun.email },
    { role: "FACULTY (awaiting approval)", email: "faculty.pending@srmist.edu.in" },
    { role: "STUDENT", email: aarav.email },
    { role: "STUDENT (low attendance)", email: rohan.email },
  ]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
