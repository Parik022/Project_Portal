const express = require("express");
const userController = require("../controllers/user.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const { validate } = require("../middleware/validate.middleware");
const { idParamSchema } = require("../validators/common.validator");
const {
  listUsersQuerySchema,
  updateUserSchema,
  assignGuideSchema,
  createUserSchema,
} = require("../validators/user.validator");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

router.use(authenticate);

router.get("/faculty", asyncHandler(userController.facultyDirectory));
router.get("/", authorizeRoles("ADMIN", "HOD"), validate(listUsersQuerySchema, "query"), asyncHandler(userController.listUsers));
router.post("/", authorizeRoles("ADMIN"), validate(createUserSchema), asyncHandler(userController.createUser));
router.get("/:id", authorizeRoles("ADMIN", "HOD"), validate(idParamSchema, "params"), asyncHandler(userController.getUser));
router.patch(
  "/:id",
  authorizeRoles("ADMIN"),
  validate(idParamSchema, "params"),
  validate(updateUserSchema),
  asyncHandler(userController.updateUser)
);
router.patch(
  "/:id/guide",
  authorizeRoles("ADMIN"),
  validate(idParamSchema, "params"),
  validate(assignGuideSchema),
  asyncHandler(userController.assignGuide)
);
router.delete("/:id", authorizeRoles("ADMIN"), validate(idParamSchema, "params"), asyncHandler(userController.deactivateUser));

module.exports = router;
