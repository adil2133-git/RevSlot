import type { Request, Response } from "express";
import { notificationService } from "./notification.service.js";
import { AppError } from "../../core/errors/AppError.js";
import type { ListNotificationsQuery } from "./notification.schema.js";

export const notificationController = {
  listNotifications: async (req: Request, res: Response) => {
    const query = res.locals.query as ListNotificationsQuery;
    const result = await notificationService.listNotifications(req.user!.userId, query.limit);
    res.status(200).json({ success: true, data: result });
  },

  markAsRead: async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new AppError("Invalid notification id", 400);

    const result = await notificationService.markAsRead(req.user!.userId, id);
    res.status(200).json({ success: true, data: { notification: result } });
  },

  markAllAsRead: async (req: Request, res: Response) => {
    await notificationService.markAllAsRead(req.user!.userId);
    res.status(200).json({ success: true, message: "All notifications marked as read" });
  },
};