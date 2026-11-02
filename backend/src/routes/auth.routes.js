const express = require("express");
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimit.middleware");
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} = require("../validators/auth.validator");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

router.post("/register", registerLimiter, validate(registerSchema), asyncHandler(authController.register));
router.post("/login", loginLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post("/logout", authenticate, asyncHandler(authController.logout));
router.get("/profile", authenticate, asyncHandler(authController.getProfile));
router.patch("/profile", authenticate, validate(updateProfileSchema), asyncHandler(authController.updateProfile));
router.patch("/password", authenticate, validate(changePasswordSchema), asyncHandler(authController.changePassword));

module.exports = router;
