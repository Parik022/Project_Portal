const attendanceService = require("../services/attendance.service");
const { sendSuccess } = require("../utils/apiResponse");

const markAttendance = async (req, res) => {
  const record = await attendanceService.markAttendance(req.user, req.body);
  sendSuccess(res, record, "Attendance marked. Waiting for your guide to verify.", 201);
};

const listAttendance = async (req, res) => {
  sendSuccess(res, await attendanceService.listAttendance(req.user, req.query), "Attendance records retrieved");
};

const verifyAttendance = async (req, res) => {
  const record = await attendanceService.verifyAttendance(req.user, req.params.id, req.body);
  sendSuccess(res, record, `Attendance ${record.status.toLowerCase()}`);
};

// Student: own summary. Everyone else: aggregate stats for their scope.
const getStats = async (req, res) => {
  const stats =
    req.user.role === "STUDENT"
      ? await attendanceService.getStudentSummary(req.user, req.user.id)
      : await attendanceService.getScopeStats(req.user);
  sendSuccess(res, stats, "Attendance stats retrieved");
};

const getStudentSummary = async (req, res) => {
  sendSuccess(res, await attendanceService.getStudentSummary(req.user, req.params.studentId), "Attendance summary retrieved");
};

const getReport = async (req, res) => {
  const rows = await attendanceService.getScopeSummaries(req.user);
  if (req.query.format === "csv") {
    const header = "Name,Register No,Email,Department,Guide,Working days,Present,Pending,Absent,Attendance %";
    const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = rows.map((r) =>
      [r.name, r.registerNo, r.email, r.department, r.guide?.name, r.attendance.workingDays, r.attendance.present, r.attendance.pending, r.attendance.absent, r.attendance.percentage]
        .map(escape)
        .join(",")
    );
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="attendance-report.csv"');
    return res.send([header, ...lines].join("\n"));
  }
  sendSuccess(res, rows, "Attendance report retrieved");
};

module.exports = { markAttendance, listAttendance, verifyAttendance, getStats, getStudentSummary, getReport };
