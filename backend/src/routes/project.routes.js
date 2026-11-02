const express = require("express");
const projectController = require("../controllers/project.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const { validate } = require("../middleware/validate.middleware");
const { idParamSchema } = require("../validators/common.validator");
const {
  createProjectSchema,
  proposeProjectSchema,
  updateProjectSchema,
  reviewProjectSchema,
  assignFacultySchema,
  listProjectsQuerySchema,
} = require("../validators/project.validator");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();
const withId = validate(idParamSchema, "params");

router.use(authenticate);

router.get("/", validate(listProjectsQuerySchema, "query"), asyncHandler(projectController.getProjects));
router.post("/", authorizeRoles("FACULTY"), validate(createProjectSchema), asyncHandler(projectController.createProject));
router.post("/proposals", authorizeRoles("STUDENT"), validate(proposeProjectSchema), asyncHandler(projectController.proposeProject));
router.get("/:id", withId, asyncHandler(projectController.getProject));
router.patch("/:id", authorizeRoles("FACULTY", "ADMIN"), withId, validate(updateProjectSchema), asyncHandler(projectController.updateProject));
// PUT kept for older clients; same behaviour as PATCH.
router.put("/:id", authorizeRoles("FACULTY", "ADMIN"), withId, validate(updateProjectSchema), asyncHandler(projectController.updateProject));
router.patch("/:id/review", authorizeRoles("FACULTY", "ADMIN"), withId, validate(reviewProjectSchema), asyncHandler(projectController.reviewProposal));
router.patch("/:id/faculty", authorizeRoles("ADMIN"), withId, validate(assignFacultySchema), asyncHandler(projectController.assignFaculty));
router.delete("/:id", authorizeRoles("FACULTY", "ADMIN"), withId, asyncHandler(projectController.deleteProject));

module.exports = router;
