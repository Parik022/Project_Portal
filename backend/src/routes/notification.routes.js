const express = require("express");
const notificationController = require("../controllers/notification.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { idParamSchema } = require("../validators/common.validator");
const { listNotificationsQuerySchema } = require("../validators/notification.validator");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

router.use(authenticate);

router.get("/", validate(listNotificationsQuerySchema, "query"), asyncHandler(notificationController.list));
router.patch("/read-all", asyncHandler(notificationController.markAllRead));
router.patch("/:id/read", validate(idParamSchema, "params"), asyncHandler(notificationController.markRead));
router.delete("/:id", validate(idParamSchema, "params"), asyncHandler(notificationController.remove));

module.exports = router;
