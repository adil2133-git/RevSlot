export type NotificationType =
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

export type Notification = {
  id: number;
  reviewerId?: number | null;
  adminId?: number | null;
  type: NotificationType;
  title: string;
  message: string;
  bookingId: number | null;
  isRead: boolean;
  createdAt: string;
};