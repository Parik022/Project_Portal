const rateLimit = require("express-rate-limit");
const { env } = require("../config/env");

const tooMany = (message) => ({ success: false, message, errors: null });

// Brute-force protection on login: N attempts per minute per IP.
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: env.LOGIN_RATE_LIMIT,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: tooMany("Too many login attempts. Try again in a minute."),
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: tooMany("Too many sign-up attempts. Try again later."),
});

module.exports = { loginLimiter, registerLimiter };
