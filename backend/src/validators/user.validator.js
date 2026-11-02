const { z } = require("zod");
const { paginationSchema } = require("../utils/pagination");
const { idSchema } = require("./common.validator");
const { registerNoSchema, departmentSchema, emailSchema, passwordSchema } = require("./auth.validator");

const roleEnum = z.enum(["STUDENT", "FACULTY", "HOD", "ADMIN"]);

const listUsersQuerySchema = z.object({
  ...paginationSchema,
  role: roleEnum.optional(),
  department: z.string().trim().optional(),
  search: z.string().trim().max(100).optional(),
  isActive: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  guideId: idSchema.optional(),
});

const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    role: roleEnum.optional(),
    department: departmentSchema.optional(),
    registerNo: registerNoSchema.nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "Nothing to update");

const assignGuideSchema = z.object({ guideId: idSchema.nullable() });

// Admin-created accounts (used for HOD, admin and pre-approved faculty).
const createUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  password: passwordSchema,
  role: roleEnum,
  department: departmentSchema,
  registerNo: registerNoSchema.optional(),
});

module.exports = { listUsersQuerySchema, updateUserSchema, assignGuideSchema, createUserSchema };
