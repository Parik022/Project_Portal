const express = require("express");
const { z } = require("zod");
const { idSchema } = require("../validators/common.validator");
const teamController = require("../controllers/team.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const { validate } = require("../middleware/validate.middleware");
const { createTeamSchema, assignStudentSchema, updateTeamSchema } = require("../validators/team.validator");
const { idParamSchema } = require("../validators/common.validator");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

router.use(authenticate);

router.get("/", asyncHandler(teamController.getTeams));
router.get("/available-students", authorizeRoles("FACULTY", "ADMIN"), asyncHandler(teamController.getAvailableStudents));

router.post(
  "/",
  authorizeRoles("FACULTY"),
  validate(createTeamSchema),
  asyncHandler(teamController.createTeam)
);

router.post(
  "/assign",
  authorizeRoles("FACULTY"),
  validate(assignStudentSchema),
  asyncHandler(teamController.assignStudent)
);

router.patch(
  "/:id",
  authorizeRoles("FACULTY", "ADMIN"),
  validate(idParamSchema, "params"),
  validate(updateTeamSchema),
  asyncHandler(teamController.updateTeam)
);

router.delete("/:id", authorizeRoles("FACULTY", "ADMIN"), validate(idParamSchema, "params"), asyncHandler(teamController.deleteTeam));

router.delete(
  "/:id/members/:studentId",
  authorizeRoles("FACULTY"),
  validate(z.object({ id: idSchema, studentId: idSchema }), "params"),
  asyncHandler(teamController.removeStudent)
);

module.exports = router;
