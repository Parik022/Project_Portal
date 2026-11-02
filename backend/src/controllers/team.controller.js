const teamService = require("../services/team.service");
const { sendSuccess } = require("../utils/apiResponse");

const createTeam = async (req, res) => {
  const team = await teamService.createTeam(req.user.id, req.body);
  sendSuccess(res, team, "Team created", 201);
};

const getTeams = async (req, res) => {
  if (req.user.role === "STUDENT") {
    const team = await teamService.getStudentTeam(req.user.id);
    return sendSuccess(res, team, "Team retrieved");
  }

  if (req.user.role === "HOD" || req.user.role === "ADMIN") {
    return sendSuccess(res, await teamService.getAllTeams(req.user), "Teams retrieved");
  }

  const { projectId } = req.query;
  const teams = projectId
    ? await teamService.getTeamsByProject(projectId, req.user.id)
    : await teamService.getTeamsByFaculty(req.user.id);
  sendSuccess(res, teams, "Teams retrieved");
};

const assignStudent = async (req, res) => {
  const student = await teamService.assignStudentToTeam(req.user.id, req.body);
  sendSuccess(res, student, "Student assigned to team");
};

const removeStudent = async (req, res) => {
  const result = await teamService.removeStudentFromTeam(req.user.id, req.params.id, req.params.studentId);
  sendSuccess(res, result, "Student removed from team");
};

module.exports = { createTeam, getTeams, assignStudent, removeStudent };
