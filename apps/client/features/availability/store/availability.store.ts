import { create } from "zustand";
import { fetchTemplates, deleteTemplateRequest } from "../api/availability.api";
import type { AvailabilityTemplate } from "../types";

interface AvailabilityState {
  templates: AvailabilityTemplate[];
  isLoading: boolean;
  error: string | null;
  loadTemplates: () => Promise<void>;
  removeTemplate: (id: number) => Promise<void>;
}

export const useAvailabilityStore = create<AvailabilityState>((set, get) => ({
  templates: [],
  isLoading: false,
  error: null,

  loadTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const templates = await fetchTemplates();
      set({ templates, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load availability",
        isLoading: false,
      });
    }
  },

  removeTemplate: async (id: number) => {
    const previous = get().templates;
    set({ templates: previous.filter((t) => t.id !== id) });
    try {
      await deleteTemplateRequest(id);
      await get().loadTemplates();
    } catch (err) {
      set({
        templates: previous, // roll back on failure
        error: err instanceof Error ? err.message : "Failed to delete template",
      });
    }
  },
}));