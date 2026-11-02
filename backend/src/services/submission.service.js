const { prisma } = require("../config/database");
const { AppError } = require("../utils/AppError");
const { notify } = require("./notification.service");

const include = {
  student: { select: { id: true, name: true, email: true, registerNo: true } },
  project: { select: { id: true, title: true, facultyId: true } },
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

  const submission = await prisma.submission.create({
    data: { ...data, studentId: student.id, projectId: project.id },
    include,
  });

  await notify(project.facultyId, `${student.name} submitted the week ${data.weekNumber} report`, "SUBMISSION_CREATED");
  return submission;
};

const listSubmissions = async (user) =>
  prisma.submission.findMany({
    where: scopeFor(user),
    include,
    orderBy: user.role === "STUDENT" ? { weekNumber: "desc" } : { createdAt: "desc" },
  });

const getSubmissionById = async (id, user) => {
  const submission = await prisma.submission.findFirst({ where: { id, ...scopeFor(user) }, include });
  if (!submission) throw new AppError("Submission not found", 404);
  return submission;
};

// Students can edit a report until it is approved; editing sends it back for review.
const updateSubmission = async (id, student, data) => {
  const submission = await prisma.submission.findFirst({ where: { id, studentId: student.id }, include });
  if (!submission) throw new AppError("Submission not found", 404);
  if (submission.status === "APPROVED") {
    throw new AppError("Approved reports can no longer be edited", 400);
  }

  const updated = await prisma.submission.update({
    where: { id },
    data: { ...data, status: "PENDING" },
    include,
  });

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

  const updated = await prisma.submission.update({
    where: { id },
    data: { status, feedback: feedback ?? null, reviewedAt: new Date() },
    include,
  });

  await notify(
    submission.studentId,
    status === "APPROVED"
      ? `Your week ${submission.weekNumber} report was approved`
      : `Changes requested on your week ${submission.weekNumber} report`,
    "SUBMISSION_REVIEWED"
  );
  return updated;
};

module.exports = { createSubmission, listSubmissions, getSubmissionById, updateSubmission, reviewSubmission };
