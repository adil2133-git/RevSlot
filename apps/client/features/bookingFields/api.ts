import api from "@/lib/axios";
import type {
  GetBookingFieldsResponse,
  ReplaceBookingFieldsPayload,
  ReplaceBookingFieldsResponse,
} from "./types";

// Reviewer-wide config — no eventTypeId here, applies to every event
// type this reviewer offers alike.
export async function fetchBookingFields() {
  const { data } = await api.get<GetBookingFieldsResponse>("/booking-fields");
  return data.data.fields;
}

export async function saveBookingFields(payload: ReplaceBookingFieldsPayload) {
  const { data } = await api.put<ReplaceBookingFieldsResponse>("/booking-fields", payload);
  return data.data.fields;
}