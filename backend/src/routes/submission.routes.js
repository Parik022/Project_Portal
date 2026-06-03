const express = require("express");
const submissionController = require("../controllers/submission.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const { validate } = require("../middleware/validate.middleware");
const {
  createSubmissionSchema,
  reviewSubmissionSchema,
} = require("../validators/submission.validator");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

router.use(authenticate);

router.get("/", asyncHandler(submissionController.getSubmissions));
router.get("/:id", asyncHandler(submissionController.getSubmission));

router.post(
  "/",
  authorizeRoles("STUDENT"),
  validate(createSubmissionSchema),
  asyncHandler(submissionController.createSubmission)
);

router.patch(
  "/:id/review",
  authorizeRoles("FACULTY"),
  validate(reviewSubmissionSchema),
  asyncHandler(submissionController.reviewSubmission)
);

module.exports = router;
