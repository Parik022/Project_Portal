const { prisma } = require("../config/database");
const { AppError } = require("../utils/AppError");
const { notify } = require("./notification.service");
const { ymdInIST, toDateOnly, formatYmd } = require("../utils/date");

const include = {
  student: { select: { id: true, name: true, email: true, registerNo: true } },
  project: { select: { id: true, title: true, facultyId: true, startDate: true, createdAt: true } },
};

// Week N's report is due on the last day of week N, counted from the project's
// start date. Late reports are accepted but flagged so faculty can see them.
const withDeadline = (submission) => {
  const project = submission.project;
  if (!project) return submission;
  const start = project.startDate ? new Date(project.startDate) : toDateOnly(ymdInIST(new Date(project.createdAt)));
  const due = new Date(start);
  due.setUTCDate(due.getUTCDate() + 7 * submission.weekNumber - 1);
  const dueDate = formatYmd(due);
  return { ...submission, dueDate, isLate: ymdInIST(new Date(submission.createdAt)) > dueDate };
};

// Which submissions a user may see.
const scopeFor = (user) => {
  switch (user.role) {
    case "STUDENT":
      return { studentId: user.id };
    case "FACULTY":
      return { project: { facultyId: user.id } };
    case "HOD":
      return { student: { department: user.department } };
    case "ADMIN":
      return {};
    default:
      return { id: "__none__" };
  }
};

const getStudentProject = async (studentId) => {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: { team: { include: { project: true } } },
  });
  if (!student?.team) {
    throw new AppError("You must be assigned to a team before submitting", 400);
  }
  return student.team.project;
};

const createSubmission = async (student, data) => {
  const project = await getStudentProject(student.id);

  const existing = await prisma.submission.findUnique({
    where: { studentId_weekNumber: { studentId: student.id, weekNumber: data.weekNumber } },
  });
  if (existing) {
    throw new AppError("You already submitted a report for this week", 409);
  }

  if (!["APPROVED", "IN_PROGRESS"].includes(project.status)) {
    throw new AppError("Reports can be submitted once your project is approved", 400);
  }

  const submission = withDeadline(
    await prisma.submission.create({
      data: { ...data, studentId: student.id, projectId: project.id },
      include,
    })
  );

  await notify(project.facultyId, `${student.name} submitted the week ${data.weekNumber} report`, "SUBMISSION_CREATED");
  return submission;
};

const listSubmissions = async (user) =>
  (
    await prisma.submission.findMany({
      where: scopeFor(user),
      include,
      orderBy: user.role === "STUDENT" ? { weekNumber: "desc" } : { createdAt: "desc" },
    })
  ).map(withDeadline);

const getSubmissionById = async (id, user) => {
  const submission = await prisma.submission.findFirst({ where: { id, ...scopeFor(user) }, include });
  if (!submission) throw new AppError("Submission not found", 404);
  return withDeadline(submission);
};

// Students can edit a report until it is approved; editing sends it back for review.
const updateSubmission = async (id, student, data) => {
  const submission = await prisma.submission.findFirst({ where: { id, studentId: student.id }, include });
  if (!submission) throw new AppError("Submission not found", 404);
  if (submission.status === "APPROVED") {
    throw new AppError("Approved reports can no longer be edited", 400);
  }

  const updated = withDeadline(
    await prisma.submission.update({
      where: { id },
      data: { ...data, status: "PENDING" },
      include,
    })
  );

  if (submission.status === "CHANGES_REQUESTED") {
    await notify(
      submission.project.facultyId,
      `${student.name} resubmitted the week ${submission.weekNumber} report`,
      "SUBMISSION_RESUBMITTED"
    );
  }
  return updated;
};

const reviewSubmission = async (id, reviewer, { status, feedback }) => {
  const submission = await prisma.submission.findFirst({
    where: { id, ...(reviewer.role === "FACULTY" ? { project: { facultyId: reviewer.id } } : {}) },
  });
  if (!submission) throw new AppError("Submission not found or access denied", 404);

  const updated = withDeadline(
    await prisma.submission.update({
      where: { id },
      data: { status, feedback: feedback ?? null, reviewedAt: new Date() },
      include,
    })
  );

  await notify(
    submission.studentId,
    status === "APPROVED"
      ? `Your week ${submission.weekNumber} report was approved`
      : `Changes requested on your week ${submission.weekNumber} report`,
    "SUBMISSION_REVIEWED"
  );
  return updated;
};

module.exports = { createSubmission, listSubmissions, getSubmissionById, updateSubmission, reviewSubmission, withDeadline };
