const { z } = require("zod");

const createProjectSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  progressPercentage: z.number().int().min(0).max(100).optional(),
});

const updateProjectSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().min(5).optional(),
  progressPercentage: z.number().int().min(0).max(100).optional(),
});

module.exports = { createProjectSchema, updateProjectSchema };
