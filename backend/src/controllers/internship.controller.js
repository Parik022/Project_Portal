const internshipService = require("../services/internship.service");
const { sendSuccess } = require("../utils/apiResponse");

const getMyInternship = async (req, res) => {
  sendSuccess(res, await internshipService.getMyInternship(req.user.id), "Internship retrieved");
};

const upsertInternship = async (req, res) => {
  sendSuccess(res, await internshipService.upsertInternship(req.user.id, req.body), "Internship saved");
};

module.exports = { getMyInternship, upsertInternship };
