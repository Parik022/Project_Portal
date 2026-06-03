const submissionService = require("../services/submission.service");
const { sendSuccess } = require("../utils/apiResponse");

const createSubmission = async (req, res) => {
  const submission = await submissionService.createSubmission(req.user.id, req.body);
  sendSuccess(res, submission, "Submission created and attendance marked", 201);
};

const getSubmissions = async (req, res) => {
  const submissions =
    req.user.role === "FACULTY"
      ? await submissionService.getFacultySubmissions(req.user.id)
      : await submissionService.getStudentSubmissions(req.user.id);
  sendSuccess(res, submissions, "Submissions retrieved");
};

const getSubmission = async (req, res) => {
  const submission = await submissionService.getSubmissionById(req.params.id, req.user);
  sendSuccess(res, submission, "Submission retrieved");
};

const reviewSubmission = async (req, res) => {
  const submission = await submissionService.reviewSubmission(
    req.params.id,
    req.user.id,
    req.body
  );
  sendSuccess(res, submission, "Submission reviewed");
};

module.exports = { createSubmission, getSubmissions, getSubmission, reviewSubmission };
