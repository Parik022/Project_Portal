const attendanceService = require("../services/attendance.service");
const { sendSuccess } = require("../utils/apiResponse");

const getAttendance = async (req, res) => {
  const records =
    req.user.role === "FACULTY"
      ? await attendanceService.getFacultyAttendance(req.user.id)
      : await attendanceService.getStudentAttendance(req.user.id);
  sendSuccess(res, records, "Attendance records retrieved");
};

const getAttendanceStats = async (req, res) => {
  const stats =
    req.user.role === "FACULTY"
      ? await attendanceService.getFacultyAttendanceStats(req.user.id)
      : await attendanceService.getStudentAttendanceStats(req.user.id);
  sendSuccess(res, stats, "Attendance stats retrieved");
};

module.exports = { getAttendance, getAttendanceStats };
