const { prisma } = require("../config/database");
const {
  getFacultyAttendanceStats,
  getStudentAttendanceStats,
} = require("./attendance.service");

const getFacultyDashboard = async (facultyId) => {
  const [totalProjects, totalTeams, totalStudents, totalSubmissions, attendance, recentSubmissions, projects] =
    await Promise.all([
      prisma.project.count({ where: { facultyId } }),
      prisma.team.count({ where: { project: { facultyId } } }),
      prisma.user.count({
        where: { role: "STUDENT", team: { project: { facultyId } } },
      }),
      prisma.submission.count({ where: { project: { facultyId } } }),
      getFacultyAttendanceStats(facultyId),
      prisma.submission.findMany({
        where: { project: { facultyId } },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          student: { select: { id: true, name: true } },
          project: { select: { id: true, title: true } },
        },
      }),
      prisma.project.findMany({
        where: { facultyId },
        select: {
          id: true,
          title: true,
          progressPercentage: true,
          _count: { select: { teams: true, submissions: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  return {
    stats: {
      totalProjects,
      totalTeams,
      totalStudents,
      totalSubmissions,
      attendancePercentage: attendance.percentage,
    },
    recentSubmissions,
    projectProgress: projects,
    attendanceOverview: attendance,
  };
};

const getStudentDashboard = async (studentId) => {
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

  const [submissionCount, attendance, recentSubmissions] = await Promise.all([
    prisma.submission.count({ where: { studentId } }),
    getStudentAttendanceStats(studentId),
    prisma.submission.findMany({
      where: { studentId },
      take: 5,
      orderBy: { weekNumber: "desc" },
      include: { attendance: true },
    }),
  ]);

  return {
    assignedProject: student?.team?.project || null,
    team: student?.team
      ? {
          id: student.team.id,
          name: student.team.name,
          members: student.team.members,
        }
      : null,
    stats: {
      submissionCount,
      attendancePercentage: attendance.percentage,
    },
    recentSubmissions,
    attendanceOverview: attendance,
  };
};

module.exports = { getFacultyDashboard, getStudentDashboard };
