const { prisma } = require("../config/database");
const { AppError } = require("../utils/AppError");

const getFacultyAttendance = async (facultyId) => {
  return prisma.attendance.findMany({
    where: { student: { team: { project: { facultyId } } } },
    include: {
      student: { select: { id: true, name: true, email: true } },
      submission: {
        select: { id: true, title: true, weekNumber: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

const getStudentAttendance = async (studentId) => {
  return prisma.attendance.findMany({
    where: { studentId },
    include: {
      submission: {
        select: { id: true, title: true, weekNumber: true, status: true },
      },
    },
    orderBy: { weekNumber: "desc" },
  });
};

const calculateAttendancePercentage = (records) => {
  if (records.length === 0) return 0;
  const present = records.filter((r) => r.status === "PRESENT").length;
  return Math.round((present / records.length) * 100);
};

const getFacultyAttendanceStats = async (facultyId) => {
  const records = await prisma.attendance.findMany({
    where: { student: { team: { project: { facultyId } } } },
  });
  return {
    total: records.length,
    present: records.filter((r) => r.status === "PRESENT").length,
    percentage: calculateAttendancePercentage(records),
  };
};

const getStudentAttendanceStats = async (studentId) => {
  const records = await prisma.attendance.findMany({ where: { studentId } });
  return {
    total: records.length,
    present: records.filter((r) => r.status === "PRESENT").length,
    percentage: calculateAttendancePercentage(records),
  };
};

module.exports = {
  getFacultyAttendance,
  getStudentAttendance,
  getFacultyAttendanceStats,
  getStudentAttendanceStats,
  calculateAttendancePercentage,
};
