const express = require("express");
const internshipController = require("../controllers/internship.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const { validate } = require("../middleware/validate.middleware");
const { upsertInternshipSchema } = require("../validators/internship.validator");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

router.use(authenticate, authorizeRoles("STUDENT"));

router.get("/me", asyncHandler(internshipController.getMyInternship));
router.put("/me", validate(upsertInternshipSchema), asyncHandler(internshipController.upsertInternship));

module.exports = router;
