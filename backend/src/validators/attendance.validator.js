const { z } = require("zod");
const { paginationSchema } = require("../utils/pagination");
const { idSchema, ymdSchema } = require("./common.validator");

const markAttendanceSchema = z.object({
  mode: z.enum(["ONSITE", "REMOTE"]),
  summary: z.string().trim().min(10, "Describe today's work in at least 10 characters").max(500),
});

const verifyAttendanceSchema = z
  .object({
    status: z.enum(["VERIFIED", "REJECTED"]),
    remark: z.string().trim().max(300).optional(),
  })
  .refine((data) => data.status !== "REJECTED" || (data.remark && data.remark.length >= 3), {
    message: "Give a reason when rejecting attendance",
    path: ["remark"],
  });

const listAttendanceQuerySchema = z.object({
  ...paginationSchema,
  studentId: idSchema.optional(),
  status: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional(),
  from: ymdSchema.optional(),
  to: ymdSchema.optional(),
});

const studentIdParamSchema = z.object({ studentId: idSchema });

module.exports = {
  markAttendanceSchema,
  verifyAttendanceSchema,
  listAttendanceQuerySchema,
  studentIdParamSchema,
};
