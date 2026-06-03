const { prisma } = require("../config/database");
const { AppError } = require("../utils/AppError");

const createProject = async (facultyId, data) => {
  return prisma.project.create({
    data: {
      title: data.title,
      description: data.description,
      facultyId,
      progressPercentage: data.progressPercentage ?? 0,
    },
    include: {
      faculty: { select: { id: true, name: true, email: true } },
      teams: true,
      _count: { select: { submissions: true, teams: true } },
    },
  });
};

const getFacultyProjects = async (facultyId) => {
  return prisma.project.findMany({
    where: { facultyId },
    include: {
      teams: {
        include: {
          members: { select: { id: true, name: true, email: true } },
          _count: { select: { members: true } },
        },
      },
      _count: { select: { submissions: true, teams: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

const getStudentProjects = async (studentId) => {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: {
      team: {
        include: {
          project: {
            include: {
              faculty: { select: { id: true, name: true, email: true } },
              teams: {
                include: {
                  members: { select: { id: true, name: true, email: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!student?.team?.project) {
    return [];
  }

  return [student.team.project];
};

const getProjectById = async (projectId, user) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      faculty: { select: { id: true, name: true, email: true } },
      teams: {
        include: {
          members: { select: { id: true, name: true, email: true } },
        },
      },
      _count: { select: { submissions: true } },
    },
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (user.role === "FACULTY" && project.facultyId !== user.id) {
    throw new AppError("You do not have access to this project", 403);
  }

  if (user.role === "STUDENT") {
    const student = await prisma.user.findUnique({
      where: { id: user.id },
      include: { team: true },
    });
    if (!student?.team || student.team.projectId !== projectId) {
      throw new AppError("You do not have access to this project", 403);
    }
  }

  return project;
};

const updateProject = async (projectId, facultyId, data) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, facultyId },
  });

  if (!project) {
    throw new AppError("Project not found or access denied", 404);
  }

  return prisma.project.update({
    where: { id: projectId },
    data,
    include: {
      faculty: { select: { id: true, name: true, email: true } },
      teams: true,
    },
  });
};

const deleteProject = async (projectId, facultyId) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, facultyId },
  });

  if (!project) {
    throw new AppError("Project not found or access denied", 404);
  }

  await prisma.project.delete({ where: { id: projectId } });
  return { message: "Project deleted successfully" };
};

module.exports = {
  createProject,
  getFacultyProjects,
  getStudentProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
