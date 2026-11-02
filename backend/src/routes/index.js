const express = require("express");
const { prisma } = require("../config/database");
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const internshipRoutes = require("./internship.routes");
const projectRoutes = require("./project.routes");
const teamRoutes = require("./team.routes");
const submissionRoutes = require("./submission.routes");
const attendanceRoutes = require("./attendance.routes");
const notificationRoutes = require("./notification.routes");
const dashboardRoutes = require("./dashboard.routes");

const router = express.Router();

// Health check used by the hosting platform; also confirms the database answers.
router.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, message: "ProjectFlow API is running", data: { database: "up" } });
  } catch {
    res.status(503).json({ success: false, message: "Database unavailable", errors: null });
  }
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/internships", internshipRoutes);
router.use("/projects", projectRoutes);
router.use("/teams", teamRoutes);
router.use("/submissions", submissionRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/notifications", notificationRoutes);
router.use("/dashboard", dashboardRoutes);

module.exports = router;
