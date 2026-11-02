const { prisma } = require("../config/database");
const { env } = require("../config/env");
const { AppError } = require("../utils/AppError");
const { todayIST, toDateOnly, formatYmd, isWeekend, countWorkingDays } = require("../utils/date");
const { toPrismaPage, paginated } = require("../utils/pagination");
const { notify } = require("./notification.service");

// Which students' attendance a user may see.
const studentScope = (actor) => {
  switch (actor.role) {
    case "STUDENT":
      return { id: actor.id };
    case "FACULTY":
      return { guideId: actor.id };
    case "HOD":
      return { department: actor.department };
    case "ADMIN":
      return {};
    default:
      return { id: "__none__" };
  }
};

const assertCanSeeStudent = async (actor, studentId) => {
  const student = await prisma.user.findFirst({
    where: { id: studentId, role: "STUDENT", ...studentScope(actor) },
    include: { internship: true },
  });
  if (!student) throw new AppError("Student not found or access denied", 404);
  return student;
};

// ---------- Student check-in ----------

const markAttendance = async (student, { mode, summary }) => {
  const today = todayIST();

  if (isWeekend(today)) {
    throw new AppError("Attendance is recorded Monday to Friday only", 400);
  }

  const internship = await prisma.internship.findUnique({ where: { studentId: student.id } });
  if (!internship) {
    throw new AppError("Add your internship details before marking attendance", 400);
  }
  if (today < internship.startDate || today > internship.endDate) {
    throw new AppError("Today is outside your internship period", 400);
  }

  const existing = await prisma.attendance.findUnique({
    where: { studentId_date: { studentId: student.id, date: today } },
  });
  if (existing) {
    throw new AppError("Attendance already marked for today", 409);
  }

  const record = await prisma.attendance.create({
    data: { studentId: student.id, date: today, mode, summary },
  });

  if (student.guideId) {
    await notify(student.guideId, `${student.name} marked attendance for ${formatYmd(today)}`, "ATTENDANCE_MARKED");
  }
  return record;
};

// ---------- Listing and verification ----------

const listAttendance = async (actor, query) => {
  const where = {
    student: studentScope(actor),
    ...(query.studentId ? { studentId: query.studentId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.from || query.to
      ? {
          date: {
            ...(query.from ? { gte: toDateOnly(query.from) } : {}),
            ...(query.to ? { lte: toDateOnly(query.to) } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, email: true, registerNo: true } },
        verifiedBy: { select: { id: true, name: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      ...toPrismaPage(query),
    }),
    prisma.attendance.count({ where }),
  ]);
  return paginated(items, total, query);
};

const verifyAttendance = async (actor, id, { status, remark }) => {
  const record = await prisma.attendance.findUnique({
    where: { id },
    include: { student: { select: { id: true, guideId: true } } },
  });
  if (!record) throw new AppError("Attendance record not found", 404);

  // Only the student's own guide (or an admin) may verify.
  if (actor.role === "FACULTY" && record.student.guideId !== actor.id) {
    throw new AppError("Only the student's assigned guide can verify this record", 403);
  }

  const updated = await prisma.attendance.update({
    where: { id },
    data: { status, remark: remark ?? null, verifiedById: actor.id, verifiedAt: new Date() },
    include: { student: { select: { id: true, name: true } }, verifiedBy: { select: { id: true, name: true } } },
  });

  const day = formatYmd(record.date);
  await notify(
    record.studentId,
    status === "VERIFIED"
      ? `Your attendance for ${day} was verified`
      : `Your attendance for ${day} was rejected: ${remark}`,
    "ATTENDANCE_REVIEWED"
  );
  return updated;
};

// ---------- Percentages ----------

// Attendance % = verified days ÷ working days (Mon–Fri) from internship start to today.
const summarize = (student, counts, today = todayIST()) => {
  const verified = counts.VERIFIED || 0;
  const pending = counts.PENDING || 0;
  const rejected = counts.REJECTED || 0;

  let workingDays = 0;
  if (student.internship) {
    const end = student.internship.endDate < today ? student.internship.endDate : today;
    workingDays = countWorkingDays(student.internship.startDate, end);
  }

  const percentage = workingDays ? Math.min(100, Math.round((verified / workingDays) * 100)) : 0;

  return {
    studentId: student.id,
    workingDays,
    present: verified,
    pending,
    rejected,
    absent: Math.max(0, workingDays - verified - pending),
    percentage,
    isLow: workingDays > 0 && percentage < env.LOW_ATTENDANCE_THRESHOLD,
    threshold: env.LOW_ATTENDANCE_THRESHOLD,
  };
};

const countsByStudent = async (studentIds) => {
  if (studentIds.length === 0) return {};
  const rows = await prisma.attendance.groupBy({
    by: ["studentId", "status"],
    where: { studentId: { in: studentIds } },
    _count: { _all: true },
  });
  return rows.reduce((acc, row) => {
    acc[row.studentId] = acc[row.studentId] || {};
    acc[row.studentId][row.status] = row._count._all;
    return acc;
  }, {});
};

const getStudentSummary = async (actor, studentId) => {
  const student = await assertCanSeeStudent(actor, studentId);
  const counts = await countsByStudent([student.id]);
  const today = todayIST();
  const todayRecord = await prisma.attendance.findUnique({
    where: { studentId_date: { studentId: student.id, date: today } },
  });
  return {
    ...summarize(student, counts[student.id] || {}, today),
    internship: student.internship,
    today: { date: formatYmd(today), isWeekend: isWeekend(today), record: todayRecord },
  };
};

// One row per student in the actor's scope, for faculty / HOD / admin tables.
const getScopeSummaries = async (actor) => {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT", isActive: true, ...studentScope(actor) },
    select: {
      id: true,
      name: true,
      email: true,
      registerNo: true,
      department: true,
      internship: true,
      guide: { select: { id: true, name: true } },
      submissions: { select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  const counts = await countsByStudent(students.map((s) => s.id));
  const today = todayIST();

  return students.map(({ submissions, ...student }) => ({
    ...student,
    lastReportAt: submissions[0]?.createdAt ?? null,
    attendance: summarize(student, counts[student.id] || {}, today),
  }));
};

const getScopeStats = async (actor) => {
  const rows = await getScopeSummaries(actor);
  const totalWorking = rows.reduce((sum, r) => sum + r.attendance.workingDays, 0);
  const totalPresent = rows.reduce((sum, r) => sum + r.attendance.present, 0);
  const pendingVerification = await prisma.attendance.count({
    where: { status: "PENDING", student: studentScope(actor) },
  });
  const checkedInToday = await prisma.attendance.count({
    where: { date: todayIST(), student: studentScope(actor) },
  });
  return {
    students: rows.length,
    percentage: totalWorking ? Math.round((totalPresent / totalWorking) * 100) : 0,
    lowAttendance: rows.filter((r) => r.attendance.isLow).length,
    pendingVerification,
    checkedInToday,
    threshold: env.LOW_ATTENDANCE_THRESHOLD,
  };
};

module.exports = {
  markAttendance,
  listAttendance,
  verifyAttendance,
  getStudentSummary,
  getScopeSummaries,
  getScopeStats,
  summarize,
  studentScope,
};
