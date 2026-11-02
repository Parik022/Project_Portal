const dashboardService = require("../services/dashboard.service");
const { sendSuccess } = require("../utils/apiResponse");

const getDashboard = async (req, res) => {
  sendSuccess(res, await dashboardService.getDashboard(req.user), "Dashboard retrieved");
};

module.exports = { getDashboard };
