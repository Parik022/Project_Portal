const { prisma } = require("../config/database");
const { AppError } = require("../utils/AppError");
const { toPrismaPage, paginated } = require("../utils/pagination");

// Fire-and-forget helper: a failed notification must never fail the main action.
const notify = async (userIds, message, type, client = prisma) => {
  const ids = [...new Set([].concat(userIds).filter(Boolean))];
  if (ids.length === 0) return;
  try {
    await client.notification.createMany({
      data: ids.map((userId) => ({ userId, message, type })),
    });
  } catch (error) {
    console.error("Failed to create notification:", error.message);
  }
};

const notifyAdmins = async (message, type) => {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true },
  });
  await notify(
    admins.map((admin) => admin.id),
    message,
    type
  );
};

const listNotifications = async (userId, query) => {
  const where = { userId, ...(query.unread ? { isRead: false } : {}) };
  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...toPrismaPage(query),
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);
  return { ...paginated(items, total, query), unreadCount };
};

const getOwned = async (id, userId) => {
  const notification = await prisma.notification.findFirst({ where: { id, userId } });
  if (!notification) throw new AppError("Notification not found", 404);
  return notification;
};

const markRead = async (id, userId) => {
  await getOwned(id, userId);
  return prisma.notification.update({ where: { id }, data: { isRead: true } });
};

const markAllRead = async (userId) => {
  const { count } = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return { updated: count };
};

const deleteNotification = async (id, userId) => {
  await getOwned(id, userId);
  await prisma.notification.delete({ where: { id } });
  return { deleted: true };
};

module.exports = {
  notify,
  notifyAdmins,
  listNotifications,
  markRead,
  markAllRead,
  deleteNotification,
};
