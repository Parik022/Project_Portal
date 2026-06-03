const express = require("express");
const projectController = require("../controllers/project.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const { validate } = require("../middleware/validate.middleware");
const {
  createProjectSchema,
  updateProjectSchema,
} = require("../validators/project.validator");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

router.use(authenticate);

router.get("/", asyncHandler(projectController.getProjects));
router.get("/:id", asyncHandler(projectController.getProject));

router.post(
  "/",
  authorizeRoles("FACULTY"),
  validate(createProjectSchema),
  asyncHandler(projectController.createProject)
);

router.put(
  "/:id",
  authorizeRoles("FACULTY"),
  validate(updateProjectSchema),
  asyncHandler(projectController.updateProject)
);

router.delete(
  "/:id",
  authorizeRoles("FACULTY"),
  asyncHandler(projectController.deleteProject)
);

module.exports = router;
