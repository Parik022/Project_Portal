const { z } = require("zod");

const idSchema = z.string().cuid("Invalid id");

const idParamSchema = z.object({ id: idSchema });

const ymdSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date");

module.exports = { idSchema, idParamSchema, ymdSchema };
