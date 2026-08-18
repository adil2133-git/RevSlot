import api from "@/lib/axios";
import type {BookingPageInfo, SlotItem, HoldResult, BookingFormPayload} from "../type";

export async function fetchBookingPageInfo(reviewerId: number, eventSlug: string) {
  const { data } = await api.get<{ success: boolean; data: BookingPageInfo }>(
    `/event-types/${reviewerId}/${eventSlug}`
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

export async function holdSlot(slotId: number) {
  const { data } = await api.post<{ success: boolean; data: HoldResult }>(
    `/slots/${slotId}/hold`
  );
  return data.data;
}

export async function createBooking(payload: BookingFormPayload) {
  const { data } = await api.post<{ success: boolean; data: unknown }>(
    "/bookings",
    payload
  );
  return data.data;
}