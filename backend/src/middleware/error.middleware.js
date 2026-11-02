const { AppError } = require("../utils/AppError");
const { env } = require("../config/env");

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let errors = err.errors || null;

  // Prisma: unique constraint
  if (err.code === "P2002") {
    statusCode = 409;
    message = "A record with this value already exists";
    errors = err.meta?.target ? { fields: [].concat(err.meta.target) } : null;
  }

  // Prisma: record not found
  if (err.code === "P2025") {
    statusCode = 404;
    message = "Record not found";
  }

  // Prisma: foreign key points nowhere
  if (err.code === "P2003") {
    statusCode = 400;
    message = "A related record does not exist";
  }

  // Malformed JSON body
  if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Request body is not valid JSON";
  }

  const isUnexpected = statusCode >= 500 && !(err instanceof AppError);

  if (isUnexpected) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
    // Never leak internals (SQL, stack traces) to clients in production.
    if (env.NODE_ENV === "production") message = "Internal server error";
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(env.NODE_ENV === "development" && isUnexpected ? { stack: err.stack } : {}),
  });
};

const notFound = (req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
};

module.exports = { errorHandler, notFound };
