import { create } from "zustand";
import {
  fetchEventTypes,
  createEventTypeRequest,
  updateEventTypeRequest,
  deactivateEventTypeRequest,
  activateEventTypeRequest,
} from "../api/eventType.api";
import type { EventType, CreateEventTypePayload, UpdateEventTypePayload } from "../types";

interface EventTypeState {
  eventTypes: EventType[];
  isLoading: boolean;
  error: string | null;

  loadEventTypes: () => Promise<void>;
  addEventType: (payload: CreateEventTypePayload) => Promise<EventType>;
  editEventType: (id: number, payload: UpdateEventTypePayload) => Promise<void>;
  toggleActive: (id: number, nextIsActive: boolean) => Promise<void>;
}

export const useEventTypeStore = create<EventTypeState>((set, get) => ({
  eventTypes: [],
  isLoading: false,
  error: null,

  loadEventTypes: async () => {
    set({ isLoading: true, error: null });
    try {
      const eventTypes = await fetchEventTypes();
      // Defensive: if the API ever responds with an unexpected shape
      // (empty body, different envelope), fall back to [] instead of
      // letting `undefined` propagate into the store and crash any
      // .filter()/.map() call downstream.
      set({ eventTypes: eventTypes ?? [], isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load event types",
        isLoading: false,
      });
    }
  },

  addEventType: async (payload) => {
    const created = await createEventTypeRequest(payload);
    set((state) => ({ eventTypes: [...state.eventTypes, created] }));
    return created;
  },

  editEventType: async (id, payload) => {
    const updated = await updateEventTypeRequest(id, payload);
    set((state) => ({
      eventTypes: state.eventTypes.map((et) => (et.id === id ? updated : et)),
    }));
  },

  // Optimistic status flip — same rollback-on-failure shape as
  // availability.store.ts's removeTemplate.
  toggleActive: async (id, nextIsActive) => {
    const previous = get().eventTypes;
    set({
      eventTypes: previous.map((et) =>
        et.id === id ? { ...et, isActive: nextIsActive } : et
      ),
    });
    try {
      const updated = nextIsActive
        ? await activateEventTypeRequest(id)
        : await deactivateEventTypeRequest(id);
      set((state) => ({
        eventTypes: state.eventTypes.map((et) => (et.id === id ? updated : et)),
      }));
    } catch (err) {
      set({
        eventTypes: previous, // roll back
        error: err instanceof Error ? err.message : "Failed to update status",
      });
    }
  },
}));