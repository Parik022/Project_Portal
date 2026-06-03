const express = require("express");
const teamController = require("../controllers/team.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const { validate } = require("../middleware/validate.middleware");
const { createTeamSchema, assignStudentSchema } = require("../validators/team.validator");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

router.use(authenticate);

router.get("/", asyncHandler(teamController.getTeams));

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

module.exports = router;
