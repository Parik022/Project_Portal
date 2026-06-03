const { z } = require("zod");

const createTeamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters"),
  projectId: z.string().min(1, "Project ID is required"),
});

const assignStudentSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  teamId: z.string().min(1, "Team ID is required"),
});

module.exports = { createTeamSchema, assignStudentSchema };
