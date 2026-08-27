import api from "@/lib/axios";
import type {
  EventType,
  EventTypeListResponse,
  EventTypeResponse,
  CreateEventTypePayload,
  UpdateEventTypePayload,
} from "../types";

export async function fetchEventTypes() {
  const { data } = await api.get<EventTypeListResponse>("/event-types");
  return data.data;
}

export async function getEventTypeByIdRequest(id: number) {
  const { data } = await api.get<EventTypeResponse>(`/event-types/${id}`);
  return data.data;
}

export async function createEventTypeRequest(payload: CreateEventTypePayload) {
  const { data } = await api.post<EventTypeResponse>("/event-types", payload);
  return data.data;
}

export async function updateEventTypeRequest(id: number, payload: UpdateEventTypePayload) {
  const { data } = await api.patch<EventTypeResponse>(`/event-types/${id}`, payload);
  return data.data;
}

// Soft delete — backend sets isActive: false, row stays intact.
export async function deactivateEventTypeRequest(id: number) {
  const { data } = await api.delete<EventTypeResponse>(`/event-types/${id}`);
  return data.data;
}

// Re-activating is just a normal PATCH — no separate backend endpoint needed.
export async function activateEventTypeRequest(id: number) {
  const { data } = await api.patch<EventTypeResponse>(`/event-types/${id}`, {
    isActive: true,
  });
  return data.data;
}

export type { EventType };