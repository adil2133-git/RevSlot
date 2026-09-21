export type AdvisorBookingScope = "upcoming" | "past" | "cancelled";

export interface AdvisorBookingItem {
  id: number;
  slotId: number;
  eventTypeId: number;
  internName: string;
  batch: string;
  advisorName: string;
  advisorEmail: string;
  weekStage: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "completed" | "rescheduled" | "cancelled" | "no_show" | "reschedule_requested";
  meetLink?: string | null;
  cancelledAt?: string | null;
  cancelledReason?: string | null;
  proposedStartTime?: string | null;
  proposedEndTime?: string | null;
  rescheduleReason?: string | null;
  rescheduleToken?: string | null;
  rescheduleRequestedBy?: string | null;
  rescheduleCount?: number | null;
  eventTypeName: string;
  bookingWindowDays?: number;
  reviewerName: string;
  timezone: string;
  hasFeedback?: boolean;
  price?: number | null;
  paymentStatus?: "created" | "captured" | "failed" | "refunded" | "partially_refunded" | null;
  paymentAmount?: number | null;
  refundAmount?: number | null;
  cancellationFee?: number | null;
  razorpayPaymentId?: string | null;
  dispute?: BookingDisputeInfo | null;
}

export interface BookingDisputeInfo {
  id: number;
  reason: "reviewer_no_show" | "technical_issue" | "inadequate_review" | "other";
  description: string;
  status: "under_review" | "resolved_refunded" | "resolved_dismissed";
  adminNotes?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface AdvisorBookingsResponse {
  bookings: AdvisorBookingItem[];
  counts: {
    upcoming: number;
    past: number;
    cancelled: number;
  };
}

export interface AdvisorPendingQuestion {
  id: number;
  questionId: number;
  questionText: string;
  description?: string | null;
  status: "pending" | "reviewed";
  assignedAt?: string | null;
  completedAt?: string | null;
}

export interface AdvisorFeedbackData {
  booking: {
    id: number;
    internName: string;
    batch: string;
    weekStage: string;
    reviewerName: string;
    eventTypeName: string;
    startTime: string;
    endTime: string;
    formName?: string | null;
  };
  feedback: {
    id: number;
    isNoShow: boolean;
    reviewMark?: string | number | null;
    taskMark?: string | number | null;
    comments?: string | null;
    understandingLevel?: string | null;
    customFieldValues?: Record<string, { label: string; fieldType: string; value: string }> | null;
    createdAt?: string | null;
    pendingQuestions?: AdvisorPendingQuestion[];
  };
  pendingQuestions?: AdvisorPendingQuestion[];
}
