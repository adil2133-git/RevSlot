import { AppError } from "../../core/errors/AppError.js";
import { emitReviewerNotification, emitAdminNotification } from "./notification.socket.js";
import {
  type NotificationTypeValue,
  insertReviewerNotificationRepo,
  insertAdminNotificationRepo,
  findActiveAdminIdsRepo,
  insertBatchAdminNotificationsRepo,
  findReviewerNotificationsWithUnreadRepo,
  findAdminNotificationsWithUnreadRepo,
  markReviewerNotificationAsReadRepo,
  markAdminNotificationAsReadRepo,
  markAllReviewerNotificationsAsReadRepo,
  markAllAdminNotificationsAsReadRepo,
  deleteStaleNotificationsRepo,
} from "./notification.repository.js";

export type { NotificationTypeValue };

export type CreateNotificationInput = {
  reviewerId?: number;
  adminId?: number;
  type: NotificationTypeValue;
  title: string;
  message: string;
  bookingId?: number;
};

export const notificationService = {
  // Fire-and-forget on purpose — a notification failing to write should never
  // roll back the business action that triggered it.
  createNotification: async (input: CreateNotificationInput) => {
    try {
      if (input.reviewerId) {
        const created = await insertReviewerNotificationRepo({
          reviewerId: input.reviewerId,
          type: input.type,
          title: input.title,
          message: input.message,
          bookingId: input.bookingId,
        });

        if (created) {
          emitReviewerNotification(input.reviewerId, created);
        }
        return created;
      }
    } catch (error) {
      console.error("[Notification] Failed to create reviewer notification:", error);
    }
  },

  // Broadcast an admin alert to all active admins (each gets their own record)
  createAdminNotification: async (input: Omit<CreateNotificationInput, "reviewerId">) => {
    try {
      if (input.adminId) {
        const created = await insertAdminNotificationRepo({
          adminId: input.adminId,
          type: input.type,
          title: input.title,
          message: input.message,
          bookingId: input.bookingId,
        });

        if (created) {
          emitAdminNotification(created, input.adminId);
        }
        return [created];
      }

      // If adminId not specified, broadcast to all active admins
      const activeAdmins = await findActiveAdminIdsRepo();

      if (activeAdmins.length === 0) return [];

      const rowsToInsert = activeAdmins.map((a) => ({
        adminId: a.id,
        type: input.type,
        title: input.title,
        message: input.message,
        bookingId: input.bookingId,
      }));

      const createdList = await insertBatchAdminNotificationsRepo(rowsToInsert);

      for (const item of createdList) {
        if (item.adminId) {
          emitAdminNotification(item, item.adminId);
        }
      }

      return createdList;
    } catch (error) {
      console.error("[Notification] Failed to create admin notification:", error);
      return [];
    }
  },

  listNotifications: async (reviewerId: number, limit: number) => {
    try {
      return await findReviewerNotificationsWithUnreadRepo(reviewerId, limit);
    } catch (error) {
      console.error("[Notification] Failed to fetch reviewer notifications:", error);
      return { notifications: [], unreadCount: 0 };
    }
  },

  listAdminNotifications: async (adminId: number, limit: number) => {
    try {
      return await findAdminNotificationsWithUnreadRepo(adminId, limit);
    } catch (error) {
      console.error("[Notification] Failed to fetch admin notifications:", error);
      return { notifications: [], unreadCount: 0 };
    }
  },

  markAsRead: async (reviewerId: number, id: number) => {
    const updated = await markReviewerNotificationAsReadRepo(reviewerId, id);

    if (!updated) throw new AppError("Notification not found", 404);
    return updated;
  },

  markAdminNotificationAsRead: async (adminId: number, id: number) => {
    const updated = await markAdminNotificationAsReadRepo(adminId, id);

    if (!updated) throw new AppError("Notification not found", 404);
    return updated;
  },

  markAllAsRead: async (reviewerId: number) => {
    await markAllReviewerNotificationsAsReadRepo(reviewerId);
  },

  markAllAdminAsRead: async (adminId: number) => {
    await markAllAdminNotificationsAsReadRepo(adminId);
  },

  cleanupStaleNotifications: async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      const deleted = await deleteStaleNotificationsRepo(thirtyDaysAgo, ninetyDaysAgo);

      console.log(`[NotificationCleanup] Purged ${deleted.length} stale notification(s).`);
      return deleted.length;
    } catch (error) {
      console.error("[NotificationCleanup] Error running notification cleanup:", error);
      return 0;
    }
  },
};