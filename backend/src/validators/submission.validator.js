const { z } = require("zod");

const linkSchema = z.string().trim().url("Link must be a valid URL").max(500);

const createSubmissionSchema = z.object({
  weekNumber: z.number().int().min(1, "Week number must be at least 1").max(52),
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(150),
  description: z.string().trim().min(5, "Description must be at least 5 characters").max(5000),
  link: linkSchema.optional(),
});

const updateSubmissionSchema = z
  .object({
    title: z.string().trim().min(2).max(150).optional(),
    description: z.string().trim().min(5).max(5000).optional(),
    link: linkSchema.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "Nothing to update");

const reviewSubmissionSchema = z
  .object({
    status: z.enum(["APPROVED", "CHANGES_REQUESTED"]),
    feedback: z.string().trim().max(2000).optional(),
  })
  .refine((data) => data.status !== "CHANGES_REQUESTED" || (data.feedback && data.feedback.length >= 5), {
    message: "Explain what needs to change",
    path: ["feedback"],
  });

module.exports = { createSubmissionSchema, updateSubmissionSchema, reviewSubmissionSchema };
