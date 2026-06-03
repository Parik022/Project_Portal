const express = require("express");
const authRoutes = require("./auth.routes");
const projectRoutes = require("./project.routes");
const teamRoutes = require("./team.routes");
const submissionRoutes = require("./submission.routes");
const attendanceRoutes = require("./attendance.routes");
const dashboardRoutes = require("./dashboard.routes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ success: true, message: "Faculty Project Portal API is running" });
});

router.use("/auth", authRoutes);
router.use("/projects", projectRoutes);
router.use("/teams", teamRoutes);
router.use("/submissions", submissionRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/dashboard", dashboardRoutes);

module.exports = router;
