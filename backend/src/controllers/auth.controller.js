const authService = require("../services/auth.service");
const { sendSuccess } = require("../utils/apiResponse");

const register = async (req, res) => {
  const result = await authService.register(req.body);
  sendSuccess(res, result, "Registration successful", 201);
};

const login = async (req, res) => {
  const result = await authService.login(req.body);
  sendSuccess(res, result, "Login successful");
};

const getProfile = async (req, res) => {
  const profile = await authService.getProfile(req.user.id);
  sendSuccess(res, profile, "Profile retrieved");
};

module.exports = { register, login, getProfile };
