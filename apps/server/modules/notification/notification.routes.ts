import { Router } from "express";
import { requireReviewer } from "../../core/middlewares/auth.middleware.js";
import { validateQuery } from "../../core/middlewares/validate.middleware.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import { notificationController } from "./notification.controller.js";
import { ListNotificationsQuerySchema } from "./notification.validation.js";

const router = Router();

router.use(requireReviewer);

router.get("/", validateQuery(ListNotificationsQuerySchema), catchAsync(notificationController.listNotifications));
router.patch("/read-all", catchAsync(notificationController.markAllAsRead));
router.patch("/:id/read", catchAsync(notificationController.markAsRead));

export default router;