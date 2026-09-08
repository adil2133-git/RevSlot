export type NotificationType =
  | "booking_created"
  | "booking_cancelled"
  | "booking_rescheduled"
  | "booking_completed"
  | "feedback_submitted";

export type Notification = {
  id: number;
  reviewerId: number;
  type: NotificationType;
  title: string;
  message: string;
  bookingId: number | null;
  isRead: boolean;
  createdAt: string;
};