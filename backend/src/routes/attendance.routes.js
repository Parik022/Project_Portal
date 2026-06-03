const express = require("express");
const attendanceController = require("../controllers/attendance.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

router.use(authenticate);

router.get("/", asyncHandler(attendanceController.getAttendance));
router.get("/stats", asyncHandler(attendanceController.getAttendanceStats));

module.exports = router;
