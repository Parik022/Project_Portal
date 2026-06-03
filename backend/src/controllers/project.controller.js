const projectService = require("../services/project.service");
const { sendSuccess } = require("../utils/apiResponse");

const createProject = async (req, res) => {
  const project = await projectService.createProject(req.user.id, req.body);
  sendSuccess(res, project, "Project created", 201);
};

const getProjects = async (req, res) => {
  const projects =
    req.user.role === "FACULTY"
      ? await projectService.getFacultyProjects(req.user.id)
      : await projectService.getStudentProjects(req.user.id);
  sendSuccess(res, projects, "Projects retrieved");
};

const getProject = async (req, res) => {
  const project = await projectService.getProjectById(req.params.id, req.user);
  sendSuccess(res, project, "Project retrieved");
};

const updateProject = async (req, res) => {
  const project = await projectService.updateProject(req.params.id, req.user.id, req.body);
  sendSuccess(res, project, "Project updated");
};

const deleteProject = async (req, res) => {
  const result = await projectService.deleteProject(req.params.id, req.user.id);
  sendSuccess(res, result, "Project deleted");
};

module.exports = { createProject, getProjects, getProject, updateProject, deleteProject };
