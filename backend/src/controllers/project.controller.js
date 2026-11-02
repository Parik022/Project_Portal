const projectService = require("../services/project.service");
const { sendSuccess } = require("../utils/apiResponse");

const getProjects = async (req, res) => {
  sendSuccess(res, await projectService.listProjects(req.user, req.query), "Projects retrieved");
};
const getProject = async (req, res) => {
  sendSuccess(res, await projectService.getProjectById(req.params.id, req.user), "Project retrieved");
};
const createProject = async (req, res) => {
  sendSuccess(res, await projectService.createProject(req.user.id, req.body), "Project created", 201);
};
const proposeProject = async (req, res) => {
  sendSuccess(res, await projectService.proposeProject(req.user, req.body), "Proposal sent to faculty", 201);
};
const reviewProposal = async (req, res) => {
  const project = await projectService.reviewProposal(req.params.id, req.user, req.body);
  sendSuccess(res, project, project.status === "APPROVED" ? "Proposal approved" : "Proposal rejected");
};
const updateProject = async (req, res) => {
  sendSuccess(res, await projectService.updateProject(req.params.id, req.user, req.body), "Project updated");
};
const assignFaculty = async (req, res) => {
  sendSuccess(res, await projectService.assignFaculty(req.params.id, req.body.facultyId), "Faculty assigned");
};
const deleteProject = async (req, res) => {
  sendSuccess(res, await projectService.deleteProject(req.params.id, req.user), "Project deleted");
};

module.exports = { getProjects, getProject, createProject, proposeProject, reviewProposal, updateProject, assignFaculty, deleteProject };
