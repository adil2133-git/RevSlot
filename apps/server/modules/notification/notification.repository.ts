import { and, desc, eq, count, or, lt, type InferInsertModel } from "drizzle-orm";
import { db } from "../../config/db.js";
import { notifications } from "./notification.schema.js";
import { admins } from "../admin/admins.schema.js";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | Transaction;

export type NotificationRecord = typeof notifications.$inferSelect;
export type NewNotification = InferInsertModel<typeof notifications>;

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

export const insertReviewerNotificationRepo = async (
  input: {
    reviewerId: number;
    type: NotificationTypeValue;
    title: string;
    message: string;
    bookingId?: number | undefined;
  },
  tx: DbOrTx = db
) => {
  const [created] = await tx
    .insert(notifications)
    .values({
      reviewerId: input.reviewerId,
      type: input.type,
      title: input.title,
      message: input.message,
      bookingId: input.bookingId,
    })
    .returning();
  return created;
};

export const insertAdminNotificationRepo = async (
  input: {
    adminId: number;
    type: NotificationTypeValue;
    title: string;
    message: string;
    bookingId?: number | undefined;
  },
  tx: DbOrTx = db
) => {
  const [created] = await tx
    .insert(notifications)
    .values({
      adminId: input.adminId,
      type: input.type,
      title: input.title,
      message: input.message,
      bookingId: input.bookingId,
    })
    .returning();
  return created;
};

export const findActiveAdminIdsRepo = async (tx: DbOrTx = db) => {
  return await tx
    .select({ id: admins.id })
    .from(admins)
    .where(eq(admins.isActive, true));
};

export const insertBatchAdminNotificationsRepo = async (
  rows: Array<{
    adminId: number;
    type: NotificationTypeValue;
    title: string;
    message: string;
    bookingId?: number | undefined;
  }>,
  tx: DbOrTx = db
) => {
  if (rows.length === 0) return [];
  return await tx.insert(notifications).values(rows).returning();
};

export const findReviewerNotificationsWithUnreadRepo = async (
  reviewerId: number,
  limit: number,
  tx: DbOrTx = db
) => {
  const [rows, unreadResult] = await Promise.all([
    tx
      .select()
      .from(notifications)
      .where(eq(notifications.reviewerId, reviewerId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit),
    tx
      .select({ total: count() })
      .from(notifications)
      .where(and(eq(notifications.reviewerId, reviewerId), eq(notifications.isRead, false))),
  ]);

  return { notifications: rows, unreadCount: unreadResult[0]?.total ?? 0 };
};

export const findAdminNotificationsWithUnreadRepo = async (
  adminId: number,
  limit: number,
  tx: DbOrTx = db
) => {
  const [rows, unreadResult] = await Promise.all([
    tx
      .select()
      .from(notifications)
      .where(eq(notifications.adminId, adminId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit),
    tx
      .select({ total: count() })
      .from(notifications)
      .where(and(eq(notifications.adminId, adminId), eq(notifications.isRead, false))),
  ]);

  return { notifications: rows, unreadCount: unreadResult[0]?.total ?? 0 };
};

export const markReviewerNotificationAsReadRepo = async (
  reviewerId: number,
  id: number,
  tx: DbOrTx = db
) => {
  const [updated] = await tx
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.reviewerId, reviewerId)))
    .returning();
  return updated;
};

export const markAdminNotificationAsReadRepo = async (
  adminId: number,
  id: number,
  tx: DbOrTx = db
) => {
  const [updated] = await tx
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.adminId, adminId)))
    .returning();
  return updated;
};

export const markAllReviewerNotificationsAsReadRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  return await tx
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.reviewerId, reviewerId), eq(notifications.isRead, false)));
};

export const markAllAdminNotificationsAsReadRepo = async (
  adminId: number,
  tx: DbOrTx = db
) => {
  return await tx
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.adminId, adminId), eq(notifications.isRead, false)));
};

export const deleteStaleNotificationsRepo = async (
  readThreshold: Date,
  unreadThreshold: Date,
  tx: DbOrTx = db
) => {
  return await tx
    .delete(notifications)
    .where(
      or(
        and(eq(notifications.isRead, true), lt(notifications.createdAt, readThreshold)),
        and(eq(notifications.isRead, false), lt(notifications.createdAt, unreadThreshold))
      )
    )
    .returning({ id: notifications.id });
};

export const notificationRepository = {
  insertReviewerNotification: insertReviewerNotificationRepo,
  insertAdminNotification: insertAdminNotificationRepo,
  findActiveAdminIds: findActiveAdminIdsRepo,
  insertBatchAdminNotifications: insertBatchAdminNotificationsRepo,
  findReviewerNotificationsWithUnread: findReviewerNotificationsWithUnreadRepo,
  findAdminNotificationsWithUnread: findAdminNotificationsWithUnreadRepo,
  markReviewerNotificationAsRead: markReviewerNotificationAsReadRepo,
  markAdminNotificationAsRead: markAdminNotificationAsReadRepo,
  markAllReviewerNotificationsAsRead: markAllReviewerNotificationsAsReadRepo,
  markAllAdminNotificationsAsRead: markAllAdminNotificationsAsReadRepo,
  deleteStaleNotifications: deleteStaleNotificationsRepo,
};
