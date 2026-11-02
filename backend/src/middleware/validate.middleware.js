const { AppError } = require("../utils/AppError");

// Validates req[source] against a Zod schema and replaces it with the parsed
// (typed, defaulted) value. source: "body" | "query" | "params".
const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(req[source] ?? {});

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    return next(new AppError("Validation failed", 400, errors));
  }

  // Express 5 exposes req.query as a getter, so it must be redefined, not assigned.
  Object.defineProperty(req, source, {
    value: result.data,
    writable: true,
    configurable: true,
    enumerable: true,
  });
  next();
};

module.exports = { validate };
