import { and, desc, eq, count } from "drizzle-orm";
import { db } from "../../config/db.js";
import { notifications } from "./notification.schema.js";
import { AppError } from "../../core/errors/AppError.js";

export type NotificationTypeValue =
  | "booking_created"
  | "booking_cancelled"
  | "booking_rescheduled"
  | "booking_completed"
  | "feedback_submitted";

type CreateNotificationInput = {
  reviewerId: number;
  type: NotificationTypeValue;
  title: string;
  message: string;
  bookingId?: number;
};

export const notificationService = {
  // Fire-and-forget on purpose — same pattern as auditLogService.recordAuditLog.
  // A notification failing to write should never fail (or roll back) the
  // booking/feedback action that triggered it.
  createNotification: async (input: CreateNotificationInput) => {
    try {
      await db.insert(notifications).values({
        reviewerId: input.reviewerId,
        type: input.type,
        title: input.title,
        message: input.message,
        bookingId: input.bookingId,
      });
    } catch (error) {
      console.error("Failed to create notification:", error);
    }
  },

  listNotifications: async (reviewerId: number, limit: number) => {
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

  markAllAsRead: async (reviewerId: number) => {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.reviewerId, reviewerId), eq(notifications.isRead, false)));
  },
};