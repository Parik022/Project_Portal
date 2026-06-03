const { AppError } = require("../utils/AppError");
const { env } = require("../config/env");

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  if (err.code === "P2002") {
    statusCode = 409;
    message = "A record with this value already exists";
  }

  if (err.code === "P2025") {
    statusCode = 404;
    message = "Record not found";
  }

  if (env.NODE_ENV === "development" && !err.isOperational) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || null,
    ...(env.NODE_ENV === "development" && !err.isOperational ? { stack: err.stack } : {}),
  });
};

const notFound = (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
};

module.exports = { errorHandler, notFound };
