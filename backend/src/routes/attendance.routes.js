const express = require("express");
const attendanceController = require("../controllers/attendance.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const { validate } = require("../middleware/validate.middleware");
const { idParamSchema } = require("../validators/common.validator");
const {
  markAttendanceSchema,
  verifyAttendanceSchema,
  listAttendanceQuerySchema,
  studentIdParamSchema,
} = require("../validators/attendance.validator");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

router.use(authenticate);

router.post("/", authorizeRoles("STUDENT"), validate(markAttendanceSchema), asyncHandler(attendanceController.markAttendance));
router.get("/", validate(listAttendanceQuerySchema, "query"), asyncHandler(attendanceController.listAttendance));
router.get("/stats", asyncHandler(attendanceController.getStats));
router.get("/report", authorizeRoles("FACULTY", "HOD", "ADMIN"), asyncHandler(attendanceController.getReport));
router.get(
  "/summary/:studentId",
  validate(studentIdParamSchema, "params"),
  asyncHandler(attendanceController.getStudentSummary)
);
router.patch(
  "/:id/verify",
  authorizeRoles("FACULTY", "ADMIN"),
  validate(idParamSchema, "params"),
  validate(verifyAttendanceSchema),
  asyncHandler(attendanceController.verifyAttendance)
);

module.exports = router;
