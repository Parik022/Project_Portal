const submissionService = require("../services/submission.service");
const { sendSuccess } = require("../utils/apiResponse");

const createSubmission = async (req, res) => {
  sendSuccess(res, await submissionService.createSubmission(req.user, req.body), "Report submitted", 201);
};

const getSubmissions = async (req, res) => {
  sendSuccess(res, await submissionService.listSubmissions(req.user), "Submissions retrieved");
};

const getSubmission = async (req, res) => {
  sendSuccess(res, await submissionService.getSubmissionById(req.params.id, req.user), "Submission retrieved");
};

const updateSubmission = async (req, res) => {
  sendSuccess(res, await submissionService.updateSubmission(req.params.id, req.user, req.body), "Report updated");
};

const reviewSubmission = async (req, res) => {
  sendSuccess(res, await submissionService.reviewSubmission(req.params.id, req.user, req.body), "Report reviewed");
};

module.exports = { createSubmission, getSubmissions, getSubmission, updateSubmission, reviewSubmission };
