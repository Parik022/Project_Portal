const bcrypt = require("bcryptjs");
const { prisma } = require("../config/database");
const { AppError } = require("../utils/AppError");
const { toPrismaPage, paginated } = require("../utils/pagination");
const { userSelect, BCRYPT_ROUNDS } = require("./auth.service");
const { notify } = require("./notification.service");

const listSelect = {
  ...userSelect,
  guide: { select: { id: true, name: true } },
  _count: { select: { students: true } },
};

// HODs only ever see their own department.
const scopeFor = (actor) => (actor.role === "HOD" ? { department: actor.department } : {});

const listUsers = async (actor, query) => {
  const where = {
    ...scopeFor(actor),
    ...(query.role ? { role: query.role } : {}),
    ...(query.department && actor.role === "ADMIN" ? { department: query.department } : {}),
    ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    ...(query.guideId ? { guideId: query.guideId } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { email: { contains: query.search, mode: "insensitive" } },
            { registerNo: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, select: listSelect, orderBy: [{ role: "asc" }, { name: "asc" }], ...toPrismaPage(query) }),
    prisma.user.count({ where }),
  ]);
  return paginated(items, total, query);
};

const getUser = async (actor, id) => {
  const user = await prisma.user.findFirst({
    where: { id, ...scopeFor(actor) },
    select: { ...listSelect, internship: true },
  });
  if (!user) throw new AppError("User not found", 404);
  return user;
};

const createUser = async (data) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError("Email already registered", 409);
  return prisma.user.create({
    data: {
      ...data,
      registerNo: data.role === "STUDENT" ? data.registerNo ?? null : null,
      password: await bcrypt.hash(data.password, BCRYPT_ROUNDS),
    },
    select: userSelect,
  });
};

const updateUser = async (actor, id, data) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError("User not found", 404);

  if (id === actor.id && (data.isActive === false || (data.role && data.role !== "ADMIN"))) {
    throw new AppError("You cannot deactivate or demote your own account", 400);
  }

  const updated = await prisma.user.update({ where: { id }, data, select: userSelect });

  if (data.isActive === true && !user.isActive) {
    await notify(id, "Your account has been approved. You can now log in.", "ACCOUNT_APPROVED");
  }
  return updated;
};

const assignGuide = async (studentId, guideId) => {
  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student || student.role !== "STUDENT") throw new AppError("Student not found", 404);

  if (guideId) {
    const guide = await prisma.user.findUnique({ where: { id: guideId } });
    if (!guide || guide.role !== "FACULTY" || !guide.isActive) {
      throw new AppError("Guide must be an active faculty member", 400);
    }
  }

  const updated = await prisma.user.update({
    where: { id: studentId },
    data: { guideId },
    select: listSelect,
  });

  if (guideId) {
    await notify(guideId, `${student.name} has been assigned to you as an internship student`, "GUIDE_ASSIGNED");
    await notify(studentId, `${updated.guide.name} is now your internship guide`, "GUIDE_ASSIGNED");
  }
  return updated;
};

// Soft delete: keeps attendance and submission history intact.
const deactivateUser = async (actor, id) => updateUser(actor, id, { isActive: false });

module.exports = { listUsers, getUser, createUser, updateUser, assignGuide, deactivateUser };
