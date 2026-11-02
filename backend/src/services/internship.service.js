const { prisma } = require("../config/database");
const { toDateOnly } = require("../utils/date");

const getMyInternship = async (studentId) =>
  prisma.internship.findUnique({ where: { studentId } });

const upsertInternship = async (studentId, data) => {
  const values = {
    company: data.company,
    position: data.position,
    mode: data.mode,
    startDate: toDateOnly(data.startDate),
    endDate: toDateOnly(data.endDate),
  };
  return prisma.internship.upsert({
    where: { studentId },
    create: { studentId, ...values },
    update: values,
  });
};

module.exports = { getMyInternship, upsertInternship };
