import { and, desc, eq, count, isNull, or, lt } from "drizzle-orm";
import { db } from "../../config/db.js";
import { notifications } from "./notification.schema.js";
import { admins } from "../admin/admins.schema.js";
import { AppError } from "../../core/errors/AppError.js";
import { emitReviewerNotification, emitAdminNotification } from "./notification.socket.js";

export type NotificationTypeValue =
  | "booking_created"
  | "booking_cancelled"
  | "booking_rescheduled"
  | "booking_completed"
  | "feedback_submitted"
  | "session_reminder"
  | "dispute_filed"
  | "dispute_resolved"
  | "payout_processed"
  | "payout_rejected"
  | "admin_new_dispute"
  | "admin_new_payout"
  | "admin_new_reviewer";

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
        const [created] = await db
          .insert(notifications)
          .values({
            reviewerId: input.reviewerId,
            type: input.type,
            title: input.title,
            message: input.message,
            bookingId: input.bookingId,
          })
          .returning();

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
        const [created] = await db
          .insert(notifications)
          .values({
            adminId: input.adminId,
            type: input.type,
            title: input.title,
            message: input.message,
            bookingId: input.bookingId,
          })
          .returning();

        if (created) {
          emitAdminNotification(created, input.adminId);
        }
        return [created];
      }

      // If adminId not specified, broadcast to all active admins
      const activeAdmins = await db
        .select({ id: admins.id })
        .from(admins)
        .where(eq(admins.isActive, true));

      if (activeAdmins.length === 0) return [];

      const rowsToInsert = activeAdmins.map((a) => ({
        adminId: a.id,
        type: input.type,
        title: input.title,
        message: input.message,
        bookingId: input.bookingId,
      }));

      const createdList = await db.insert(notifications).values(rowsToInsert).returning();

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
      const [rows, unreadResult] = await Promise.all([
        db
          .select()
          .from(notifications)
          .where(eq(notifications.reviewerId, reviewerId))
          .orderBy(desc(notifications.createdAt))
          .limit(limit),
        db
          .select({ total: count() })
          .from(notifications)
          .where(and(eq(notifications.reviewerId, reviewerId), eq(notifications.isRead, false))),
      ]);

      return { notifications: rows, unreadCount: unreadResult[0]?.total ?? 0 };
    } catch (error) {
      console.error("[Notification] Failed to fetch reviewer notifications:", error);
      return { notifications: [], unreadCount: 0 };
    }
  },

  listAdminNotifications: async (adminId: number, limit: number) => {
    try {
      const [rows, unreadResult] = await Promise.all([
        db
          .select()
          .from(notifications)
          .where(eq(notifications.adminId, adminId))
          .orderBy(desc(notifications.createdAt))
          .limit(limit),
        db
          .select({ total: count() })
          .from(notifications)
          .where(and(eq(notifications.adminId, adminId), eq(notifications.isRead, false))),
      ]);

      return { notifications: rows, unreadCount: unreadResult[0]?.total ?? 0 };
    } catch (error) {
      console.error("[Notification] Failed to fetch admin notifications:", error);
      return { notifications: [], unreadCount: 0 };
    }
  },

  markAsRead: async (reviewerId: number, id: number) => {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.reviewerId, reviewerId)))
      .returning();

    if (!updated) throw new AppError("Notification not found", 404);
    return updated;
  },

  markAdminNotificationAsRead: async (adminId: number, id: number) => {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.adminId, adminId)))
      .returning();

    if (!updated) throw new AppError("Notification not found", 404);
    return updated;
  },

  markAllAsRead: async (reviewerId: number) => {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.reviewerId, reviewerId), eq(notifications.isRead, false)));
  },

  markAllAdminAsRead: async (adminId: number) => {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.adminId, adminId), eq(notifications.isRead, false)));
  },

  cleanupStaleNotifications: async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      const deleted = await db
        .delete(notifications)
        .where(
          or(
            and(eq(notifications.isRead, true), lt(notifications.createdAt, thirtyDaysAgo)),
            and(eq(notifications.isRead, false), lt(notifications.createdAt, ninetyDaysAgo))
          )
        )
        .returning({ id: notifications.id });

      console.log(`[NotificationCleanup] Purged ${deleted.length} stale notification(s).`);
      return deleted.length;
    } catch (error) {
      console.error("[NotificationCleanup] Error running notification cleanup:", error);
      return 0;
    }
  },
};