const { prisma } = require("../config/database");
const { AppError } = require("../utils/AppError");

const MAX_TEAM_SIZE = 4;

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

  if (student.teamId === teamId) {
    throw new AppError("Student is already in this team", 409);
  }

  if (student.teamId) {
    throw new AppError("Student already belongs to another team", 409);
  }

  const memberCount = await prisma.user.count({ where: { teamId } });
  if (memberCount >= MAX_TEAM_SIZE) {
    throw new AppError(`A team can have at most ${MAX_TEAM_SIZE} members`, 400);
  }

  return prisma.user.update({
    where: { id: studentId },
    data: { teamId },
    select: { id: true, name: true, email: true, role: true, teamId: true },
  });
};

const removeStudentFromTeam = async (facultyId, teamId, studentId) => {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new AppError("Team not found", 404);
  await assertFacultyOwnsProject(team.projectId, facultyId);

  const student = await prisma.user.findFirst({ where: { id: studentId, teamId } });
  if (!student) throw new AppError("Student is not in this team", 404);

  await prisma.user.update({ where: { id: studentId }, data: { teamId: null } });
  return { removed: true };
};

const getAllTeams = async (user) =>
  prisma.team.findMany({
    where: user.role === "HOD" ? { project: { faculty: { department: user.department } } } : {},
    include: {
      project: { select: { id: true, title: true } },
      members: { select: { id: true, name: true, email: true } },
    },
    orderBy: { name: "asc" },
  });

// Students a faculty member can still add to a team.
const getAvailableStudents = async () =>
  prisma.user.findMany({
    where: { role: "STUDENT", isActive: true, teamId: null },
    select: { id: true, name: true, email: true, registerNo: true, department: true },
    orderBy: { name: "asc" },
  });

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
  removeStudentFromTeam,
  getAllTeams,
  getAvailableStudents,
  MAX_TEAM_SIZE,
};
