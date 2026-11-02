const notificationService = require("../services/notification.service");
const { sendSuccess } = require("../utils/apiResponse");

const list = async (req, res) => {
  sendSuccess(res, await notificationService.listNotifications(req.user.id, req.query), "Notifications retrieved");
};
const markRead = async (req, res) => {
  sendSuccess(res, await notificationService.markRead(req.params.id, req.user.id), "Notification marked as read");
};
const markAllRead = async (req, res) => {
  sendSuccess(res, await notificationService.markAllRead(req.user.id), "All notifications marked as read");
};
const remove = async (req, res) => {
  sendSuccess(res, await notificationService.deleteNotification(req.params.id, req.user.id), "Notification deleted");
};

module.exports = { list, markRead, markAllRead, remove };
