const { z } = require("zod");

const paginationSchema = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

const toPrismaPage = ({ page, limit }) => ({ skip: (page - 1) * limit, take: limit });

const paginated = (items, total, { page, limit }) => ({
  items,
  pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
});

module.exports = { paginationSchema, toPrismaPage, paginated };
