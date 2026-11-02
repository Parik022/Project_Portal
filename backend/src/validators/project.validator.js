const { z } = require("zod");
const { paginationSchema } = require("../utils/pagination");
const { idSchema, ymdSchema } = require("./common.validator");

const STATUSES = ["PROPOSED", "APPROVED", "REJECTED", "IN_PROGRESS", "COMPLETED"];

const base = {
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(150),
  description: z.string().trim().min(5, "Description must be at least 5 characters").max(5000),
  domain: z.string().trim().min(2, "Pick a domain").max(60),
  startDate: ymdSchema.nullable().optional(),
  deadline: ymdSchema.nullable().optional(),
};

const datesInOrder = (data) => !data.startDate || !data.deadline || data.deadline >= data.startDate;
const datesMessage = { message: "Deadline must be on or after the start date", path: ["deadline"] };

const createProjectSchema = z
  .object({ ...base, progressPercentage: z.number().int().min(0).max(100).optional() })
  .refine(datesInOrder, datesMessage);

// Students propose a project to a chosen faculty member.
const proposeProjectSchema = z.object({ ...base, facultyId: idSchema }).refine(datesInOrder, datesMessage);

const updateProjectSchema = z
  .object({
    title: base.title.optional(),
    description: base.description.optional(),
    domain: base.domain.optional(),
    startDate: base.startDate,
    deadline: base.deadline,
    progressPercentage: z.number().int().min(0).max(100).optional(),
    // Lifecycle after approval; PROPOSED/REJECTED are set through review only.
    status: z.enum(["APPROVED", "IN_PROGRESS", "COMPLETED"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "Nothing to update")
  .refine(datesInOrder, datesMessage);

const reviewProjectSchema = z
  .object({
    decision: z.enum(["APPROVED", "REJECTED"]),
    remark: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.decision !== "REJECTED" || (data.remark && data.remark.length >= 5), {
    message: "Explain why the proposal is rejected",
    path: ["remark"],
  });

const assignFacultySchema = z.object({ facultyId: idSchema });

const listProjectsQuerySchema = z.object({
  ...paginationSchema,
  limit: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().trim().max(100).optional(),
  status: z.enum(STATUSES).optional(),
  domain: z.string().trim().max(60).optional(),
  facultyId: idSchema.optional(),
  sort: z.enum(["createdAt", "deadline", "title", "progressPercentage"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

module.exports = {
  createProjectSchema,
  proposeProjectSchema,
  updateProjectSchema,
  reviewProjectSchema,
  assignFacultySchema,
  listProjectsQuerySchema,
  STATUSES,
};
