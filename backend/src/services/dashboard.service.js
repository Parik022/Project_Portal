const { prisma } = require("../config/database");
const attendanceService = require("./attendance.service");
const { withDeadline } = require("./submission.service");

const recentSubmissionInclude = {
  student: { select: { id: true, name: true } },
  project: { select: { id: true, title: true, startDate: true, createdAt: true } },
};

const getStudentDashboard = async (student) => {
  const [profile, submissionCount, pendingReviews, attendance, recentSubmissions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: student.id },
      include: {
        guide: { select: { id: true, name: true, email: true } },
        team: {
          include: {
            project: { include: { faculty: { select: { id: true, name: true, email: true } } } },
            members: { select: { id: true, name: true, email: true } },
          },
        },
      },
    }),
    prisma.submission.count({ where: { studentId: student.id } }),
    prisma.submission.count({ where: { studentId: student.id, status: "PENDING" } }),
    attendanceService.getStudentSummary(student, student.id),
    prisma.submission.findMany({ where: { studentId: student.id }, take: 5, orderBy: { weekNumber: "desc" } }),
  ]);

  return {
    role: "STUDENT",
    assignedProject: profile?.team?.project || null,
    team: profile?.team ? { id: profile.team.id, name: profile.team.name, members: profile.team.members } : null,
    guide: profile?.guide || null,
    stats: {
      submissionCount,
      pendingReviews,
      attendancePercentage: attendance.percentage,
    },
    attendance,
    recentSubmissions,
  };
};

const getFacultyDashboard = async (faculty) => {
  const facultyId = faculty.id;
  const [pendingProposals, totalProjects, totalTeams, pendingReviews, recentSubmissions, projects, students, attendanceStats] =
    await Promise.all([
      prisma.project.count({ where: { facultyId, status: "PROPOSED" } }),
      prisma.project.count({ where: { facultyId, status: { notIn: ["PROPOSED", "REJECTED"] } } }),
      prisma.team.count({ where: { project: { facultyId } } }),
      prisma.submission.count({ where: { project: { facultyId }, status: "PENDING" } }),
      prisma.submission.findMany({
        where: { project: { facultyId } },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: recentSubmissionInclude,
      }),
      prisma.project.findMany({
        where: { facultyId, status: { notIn: ["PROPOSED", "REJECTED"] } },
        select: { id: true, title: true, status: true, deadline: true, progressPercentage: true, _count: { select: { teams: true, submissions: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      attendanceService.getScopeSummaries(faculty),
      attendanceService.getScopeStats(faculty),
    ]);

  return {
    role: "FACULTY",
    stats: {
      totalProjects,
      totalTeams,
      guidedStudents: attendanceStats.students,
      pendingReviews,
      pendingProposals,
      pendingAttendance: attendanceStats.pendingVerification,
      attendancePercentage: attendanceStats.percentage,
    },
    attendanceStats,
    students,
    recentSubmissions: recentSubmissions.map(withDeadline),
    projectProgress: projects,
  };
};

const getHodDashboard = async (hod) => {
  const department = hod.department;
  const [facultyCount, pendingReviews, recentSubmissions, students, attendanceStats] = await Promise.all([
    prisma.user.count({ where: { role: "FACULTY", department, isActive: true } }),
    prisma.submission.count({ where: { status: "PENDING", student: { department } } }),
    prisma.submission.findMany({
      where: { student: { department } },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: recentSubmissionInclude,
    }),
    attendanceService.getScopeSummaries(hod),
    attendanceService.getScopeStats(hod),
  ]);

  return {
    role: "HOD",
    department,
    stats: {
      students: attendanceStats.students,
      facultyCount,
      attendancePercentage: attendanceStats.percentage,
      lowAttendance: attendanceStats.lowAttendance,
      checkedInToday: attendanceStats.checkedInToday,
      pendingReviews,
    },
    attendanceStats,
    students,
    recentSubmissions: recentSubmissions.map(withDeadline),
  };
};

const getAdminDashboard = async (admin) => {
  const [byRole, pendingFaculty, unassignedStudents, totalProjects, attendanceStats] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], where: { isActive: true }, _count: { _all: true } }),
    prisma.user.findMany({
      where: { role: "FACULTY", isActive: false },
      select: { id: true, name: true, email: true, department: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.count({ where: { role: "STUDENT", isActive: true, guideId: null } }),
    prisma.project.count(),
    attendanceService.getScopeStats(admin),
  ]);

  const users = Object.fromEntries(byRole.map((row) => [row.role, row._count._all]));

  return {
    role: "ADMIN",
    stats: {
      students: users.STUDENT || 0,
      faculty: users.FACULTY || 0,
      hods: users.HOD || 0,
      admins: users.ADMIN || 0,
      pendingFacultyApprovals: pendingFaculty.length,
      unassignedStudents,
      totalProjects,
      attendancePercentage: attendanceStats.percentage,
    },
    pendingFaculty,
    attendanceStats,
  };
};

const getDashboard = (user) => {
  switch (user.role) {
    case "FACULTY":
      return getFacultyDashboard(user);
    case "HOD":
      return getHodDashboard(user);
    case "ADMIN":
      return getAdminDashboard(user);
    default:
      return getStudentDashboard(user);
  }
};

module.exports = { getDashboard };
