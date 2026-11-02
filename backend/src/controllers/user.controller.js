const userService = require("../services/user.service");
const { sendSuccess } = require("../utils/apiResponse");

const listUsers = async (req, res) => {
  sendSuccess(res, await userService.listUsers(req.user, req.query), "Users retrieved");
};

const getUser = async (req, res) => {
  sendSuccess(res, await userService.getUser(req.user, req.params.id), "User retrieved");
};

const createUser = async (req, res) => {
  sendSuccess(res, await userService.createUser(req.body), "User created", 201);
};

const updateUser = async (req, res) => {
  sendSuccess(res, await userService.updateUser(req.user, req.params.id, req.body), "User updated");
};

const assignGuide = async (req, res) => {
  sendSuccess(res, await userService.assignGuide(req.params.id, req.body.guideId), "Guide assigned");
};

const deactivateUser = async (req, res) => {
  sendSuccess(res, await userService.deactivateUser(req.user, req.params.id), "User deactivated");
};

const facultyDirectory = async (req, res) => {
  sendSuccess(res, await userService.facultyDirectory(), "Faculty retrieved");
};

module.exports = { facultyDirectory, listUsers, getUser, createUser, updateUser, assignGuide, deactivateUser };
