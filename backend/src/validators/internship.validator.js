const { z } = require("zod");
const { ymdSchema } = require("./common.validator");

const upsertInternshipSchema = z
  .object({
    company: z.string().trim().min(2, "Company is required").max(120),
    position: z.string().trim().min(2, "Position is required").max(120),
    startDate: ymdSchema,
    endDate: ymdSchema,
    mode: z.enum(["ONSITE", "REMOTE"]).default("REMOTE"),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

module.exports = { upsertInternshipSchema };
