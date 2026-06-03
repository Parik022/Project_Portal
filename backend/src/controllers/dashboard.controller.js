const dashboardService = require("../services/dashboard.service");
const { sendSuccess } = require("../utils/apiResponse");

const getDashboard = async (req, res) => {
  const dashboard =
    req.user.role === "FACULTY"
      ? await dashboardService.getFacultyDashboard(req.user.id)
      : await dashboardService.getStudentDashboard(req.user.id);
  sendSuccess(res, dashboard, "Dashboard retrieved");
};

module.exports = { getDashboard };
