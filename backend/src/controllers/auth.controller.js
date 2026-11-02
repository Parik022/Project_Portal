const authService = require("../services/auth.service");
const { sendSuccess } = require("../utils/apiResponse");

const register = async (req, res) => {
  const { message, ...result } = await authService.register(req.body);
  sendSuccess(res, result, message || "Registration successful", 201);
};

const login = async (req, res) => {
  const result = await authService.login(req.body);
  sendSuccess(res, result, "Login successful");
};

const getProfile = async (req, res) => {
  const profile = await authService.getProfile(req.user.id);
  sendSuccess(res, profile, "Profile retrieved");
};

const updateProfile = async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  sendSuccess(res, user, "Profile updated");
};

const changePassword = async (req, res) => {
  const result = await authService.changePassword(req.user.id, req.body);
  sendSuccess(res, result, "Password changed");
};

// JWTs are stateless: logout is handled by the client deleting its token.
// This endpoint exists so clients have one consistent call to make.
const logout = async (req, res) => {
  sendSuccess(res, null, "Logged out");
};

module.exports = { register, login, getProfile, updateProfile, changePassword, logout };
