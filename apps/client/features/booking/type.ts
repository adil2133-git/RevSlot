export type BookingPageInfo = {
  reviewer: {
    id: number;
    name: string;
    avatarUrl: string | null;
    bio: string | null;
  };
  eventType: {
    id: number;
    name: string;
    slug: string;
    durationMinutes: number;
    description: string | null;
    timezone: string;
    bookingWindowDays: number;
  };
};

export type ReviewerProfile = {
  reviewer: {
    id: number;
    name: string;
    avatarUrl: string | null;
    bio: string | null;
  };
  eventTypes: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    durationMinutes: number;
    price: number;
  }[];
};

export type SlotItem = {
  eventTypeId: number;
  date: string;
  startTime: string;
  endTime: string;
};

export type HoldResult = {
  slotId: number;
  holdToken: string;
  holdExpiresAt: string;
};

export type BookingFormPayload = {
  holdToken: string;
  advisorName: string;
  advisorEmail: string;
  internName: string;
  batch: string;
  internEmails?: string[];
  weekStage: string;
};

export type MyBooking = {
  id: number;
  eventTypeId: number;
  internName: string;
  batch: string;
  advisorName: string;
  advisorEmail: string;
  weekStage: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "completed" | "cancelled" | "no_show" | "rescheduled";
  meetLink: string | null;
  cancelledAt: string | null;
  cancelledReason: string | null;
  eventTypeName: string;
  bookingWindowDays: number;
};

export type MyBookingsPagination = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
};

export type MyBookingsResponse = {
  bookings: MyBooking[];
  pagination: MyBookingsPagination;
};

export type GetMyBookingsParams = {
  page?: number;
  limit?: number;
  status?: ("confirmed" | "completed" | "rescheduled" | "cancelled")[];
  scope?: "upcoming" | "past";
};

export type BookingDetail = MyBooking & {
  internEmails: string[] | null;
  rescheduledFromBookingId: number | null;
};

export type CancelBookingPayload = {
  reason: string;
};

export type RescheduleBookingPayload = {
  date: string;
  startTime: string;
  endTime: string;
};