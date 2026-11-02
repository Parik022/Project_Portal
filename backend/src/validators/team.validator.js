const { z } = require("zod");

const createTeamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters"),
  projectId: z.string().min(1, "Project ID is required"),
});

const assignStudentSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  teamId: z.string().min(1, "Team ID is required"),
});

const updateTeamSchema = z
  .object({
    name: z.string().trim().min(2, "Team name must be at least 2 characters").max(80).optional(),
    leaderId: z.string().cuid("Invalid id").nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "Nothing to update");

module.exports = { createTeamSchema, assignStudentSchema, updateTeamSchema };
