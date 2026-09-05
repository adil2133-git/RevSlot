import api from "@/lib/axios";
import type {
  BookingPageInfo,
  ReviewerProfile,
  SlotItem,
  HoldResult,
  BookingFormPayload,
  MyBookingsResponse,
  GetMyBookingsParams,
  BookingDetail,
  CancelBookingPayload,
  RescheduleBookingPayload,
  MarkOutcomePayload,
} from "../type";

export async function fetchBookingPageInfo(username: string, eventSlug: string) {
  const { data } = await api.get<{ success: boolean; data: BookingPageInfo }>(
    `/event-types/${username}/${eventSlug}`
  );
  return data.data;
}

// Public profile page — reviewer + every active event type they offer
export async function fetchReviewerProfile(username: string) {
  const { data } = await api.get<{ success: boolean; data: ReviewerProfile }>(
    `/event-types/${username}`
  );
  return data.data;
}

export async function fetchAvailableSlots(
  eventTypeId: number,
  dateFrom: string,
  dateTo: string
) {
  const { data } = await api.get<{ success: boolean; data: SlotItem[] }>(
    "/slots/available",
    { params: { eventTypeId, dateFrom, dateTo } }
  );
  return data.data;
}

export async function holdSlot(slot: { eventTypeId: number; date: string; startTime: string; endTime: string }) {
  const { data } = await api.post<{ success: boolean; data: HoldResult }>(
    `/slots/hold`,
    slot
  );
  return data.data;
}

export async function releaseSlot(holdToken: string) {
  const { data } = await api.post<{ success: boolean; data: { released: boolean } }>(
    `/slots/release`,
    { holdToken }
  );
  return data.data;
}

export async function createBooking(payload: BookingFormPayload) {
  const { data } = await api.post<{ success: boolean; data: { meetLink: string | null }; }>(
    "/bookings",
    payload
  );
  return data.data;
}

// Reviewer's own bookings — paginated, filterable by status/scope.
// Backs the dashboard Bookings page and the Overview upcoming-bookings widget.
export async function fetchMyBookings(params: GetMyBookingsParams = {}) {
  const { data } = await api.get<{ success: boolean; data: MyBookingsResponse }>(
    "/bookings/me",
    {
      params: {
        page: params.page,
        limit: params.limit,
        status: params.status?.join(","),
        scope: params.scope,
      },
    }
  );
  return data.data;
}

// Single booking, full detail — powers the details modal
export async function fetchBookingById(id: number) {
  const { data } = await api.get<{ success: boolean; data: BookingDetail }>(
    `/bookings/${id}`
  );
  return data.data;
}

// Reviewer-initiated cancellation — reason required, backend enforces the cutoff window
export async function cancelBooking(id: number, payload: CancelBookingPayload) {
  const { data } = await api.patch<{ success: boolean; data: BookingDetail }>(
    `/bookings/${id}/cancel`,
    payload
  );
  return data.data;
}

// Reviewer-initiated reschedule — new date/time for the same event type
export async function rescheduleBooking(id: number, payload: RescheduleBookingPayload) {
  const { data } = await api.patch<{ success: boolean; data: BookingDetail & { meetLink: string | null } }>(
    `/bookings/${id}/reschedule`,
    payload
  );
  return data.data;
}

export async function markBookingOutcome(id: number, payload: MarkOutcomePayload) {
  const { data } = await api.patch<{ success: boolean; data: BookingDetail }>(
    `/bookings/${id}/status`,
    payload
  );
  return data.data;
}