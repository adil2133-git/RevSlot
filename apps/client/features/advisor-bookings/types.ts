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
  status: "confirmed" | "completed" | "rescheduled" | "cancelled" | "no_show";
  meetLink?: string | null;
  cancelledAt?: string | null;
  cancelledReason?: string | null;
  eventTypeName: string;
  reviewerName: string;
  timezone: string;
}

export interface AdvisorBookingsResponse {
  bookings: AdvisorBookingItem[];
  counts: {
    upcoming: number;
    past: number;
    cancelled: number;
  };
}
