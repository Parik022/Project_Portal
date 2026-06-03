const { prisma } = require("../config/database");
const { AppError } = require("../utils/AppError");

const assertFacultyOwnsProject = async (projectId, facultyId) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, facultyId },
  });
  if (!project) {
    throw new AppError("Project not found or access denied", 404);
  }
  return project;
};

const createTeam = async (facultyId, { name, projectId }) => {
  await assertFacultyOwnsProject(projectId, facultyId);

  return prisma.team.create({
    data: { name, projectId },
    include: {
      project: { select: { id: true, title: true } },
      members: { select: { id: true, name: true, email: true } },
    },
  });
};

const getTeamsByFaculty = async (facultyId) => {
  return prisma.team.findMany({
    where: { project: { facultyId } },
    include: {
      project: { select: { id: true, title: true } },
      members: { select: { id: true, name: true, email: true } },
    },
    orderBy: { name: "asc" },
  });
};

const getTeamsByProject = async (projectId, facultyId) => {
  await assertFacultyOwnsProject(projectId, facultyId);

  return prisma.team.findMany({
    where: { projectId },
    include: {
      members: { select: { id: true, name: true, email: true } },
    },
  });
};

const assignStudentToTeam = async (facultyId, { studentId, teamId }) => {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { project: true },
  });

  if (!team) {
    throw new AppError("Team not found", 404);
  }

  await assertFacultyOwnsProject(team.projectId, facultyId);

  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student || student.role !== "STUDENT") {
    throw new AppError("Student not found", 404);
  }

  if (student.teamId && student.teamId !== teamId) {
    throw new AppError("Student already belongs to another team", 409);
  }

  return prisma.user.update({
    where: { id: studentId },
    data: { teamId },
    select: { id: true, name: true, email: true, role: true, teamId: true },
  });
};

const getStudentTeam = async (studentId) => {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: {
      team: {
        include: {
          project: {
            include: {
              faculty: { select: { id: true, name: true, email: true } },
            },
          },
          members: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!student?.team) {
    throw new AppError("You are not assigned to a team yet", 404);
  }

  return student.team;
};

module.exports = {
  createTeam,
  getTeamsByFaculty,
  getTeamsByProject,
  assignStudentToTeam,
  getStudentTeam,
};
