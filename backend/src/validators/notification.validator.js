const { z } = require("zod");
const { paginationSchema } = require("../utils/pagination");

const listNotificationsQuerySchema = z.object({
  ...paginationSchema,
  unread: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
});

module.exports = { listNotificationsQuerySchema };
