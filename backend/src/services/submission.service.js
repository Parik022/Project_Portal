const { prisma } = require("../config/database");
const { AppError } = require("../utils/AppError");

const getStudentProjectId = async (studentId) => {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: { team: true },
  });

  if (!student?.team) {
    throw new AppError("You must be assigned to a team before submitting", 400);
  }

  return student.team.projectId;
};

const createSubmission = async (studentId, data) => {
  const projectId = await getStudentProjectId(studentId);

  const existingSubmission = await prisma.submission.findUnique({
    where: {
      studentId_weekNumber: { studentId, weekNumber: data.weekNumber },
    },
  });

  if (existingSubmission) {
    throw new AppError("Submission for this week already exists", 409);
  }

  const existingAttendance = await prisma.attendance.findUnique({
    where: {
      studentId_weekNumber: { studentId, weekNumber: data.weekNumber },
    },
  });

  if (existingAttendance) {
    throw new AppError("Attendance for this week already recorded", 409);
  }

  return prisma.$transaction(async (tx) => {
    const submission = await tx.submission.create({
      data: {
        weekNumber: data.weekNumber,
        title: data.title,
        description: data.description,
        status: data.status || "PENDING",
        studentId,
        projectId,
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, title: true } },
      },
    });

    await tx.attendance.create({
      data: {
        studentId,
        submissionId: submission.id,
        weekNumber: data.weekNumber,
        status: "PRESENT",
      },
    });

    return submission;
  });
};

const getFacultySubmissions = async (facultyId) => {
  return prisma.submission.findMany({
    where: { project: { facultyId } },
    include: {
      student: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, title: true } },
      attendance: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

const getStudentSubmissions = async (studentId) => {
  return prisma.submission.findMany({
    where: { studentId },
    include: {
      project: { select: { id: true, title: true } },
      attendance: true,
    },
    orderBy: { weekNumber: "desc" },
  });
};

const reviewSubmission = async (submissionId, facultyId, { status }) => {
  const submission = await prisma.submission.findFirst({
    where: {
      id: submissionId,
      project: { facultyId },
    },
  });

  if (!submission) {
    throw new AppError("Submission not found or access denied", 404);
  }

  return prisma.submission.update({
    where: { id: submissionId },
    data: { status },
    include: {
      student: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, title: true } },
      attendance: true,
    },
  });
};

const getSubmissionById = async (submissionId, user) => {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      student: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, title: true } },
      attendance: true,
    },
  });

  if (!submission) {
    throw new AppError("Submission not found", 404);
  }

  if (user.role === "STUDENT" && submission.studentId !== user.id) {
    throw new AppError("Access denied", 403);
  }

  if (user.role === "FACULTY") {
    const project = await prisma.project.findFirst({
      where: { id: submission.projectId, facultyId: user.id },
    });
    if (!project) {
      throw new AppError("Access denied", 403);
    }
  }

  return submission;
};

module.exports = {
  createSubmission,
  getFacultySubmissions,
  getStudentSubmissions,
  reviewSubmission,
  getSubmissionById,
};
