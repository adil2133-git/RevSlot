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
  eventTypeName: string;
  bookingWindowDays?: number;
  reviewerName: string;
  timezone: string;
  hasFeedback?: boolean;
}

export interface AdvisorBookingsResponse {
  bookings: AdvisorBookingItem[];
  counts: {
    upcoming: number;
    past: number;
    cancelled: number;
  };
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
  };
}
