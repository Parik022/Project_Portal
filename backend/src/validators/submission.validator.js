const { z } = require("zod");

const createSubmissionSchema = z.object({
  weekNumber: z.number().int().min(1, "Week number must be at least 1"),
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  status: z.enum(["PENDING", "REVIEWED"]).optional(),
});

const reviewSubmissionSchema = z.object({
  status: z.enum(["PENDING", "REVIEWED"]),
});

module.exports = { createSubmissionSchema, reviewSubmissionSchema };
