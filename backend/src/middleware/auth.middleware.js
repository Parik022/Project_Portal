const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const { prisma } = require("../config/database");
const { AppError } = require("../utils/AppError");
const { asyncHandler } = require("../utils/asyncHandler");

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Authentication required", 401);
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    throw new AppError(
      error.name === "TokenExpiredError" ? "Session expired, please log in again" : "Invalid token",
      401
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      isActive: true,
      guideId: true,
      teamId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 401);
  }

  // A token issued before deactivation must stop working immediately.
  if (!user.isActive) {
    throw new AppError("Your account is inactive", 403);
  }

  req.user = user;
  next();
});

module.exports = { authenticate };
