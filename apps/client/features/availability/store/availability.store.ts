import { create } from "zustand";
import { fetchTemplates, deleteTemplateRequest } from "../api/availability.api";
import type { AvailabilityTemplate, DeleteTemplateResult } from "../types";

interface AvailabilityState {
  templates: AvailabilityTemplate[];
  isLoading: boolean;
  error: string | null;
  loadTemplates: () => Promise<void>;
  removeTemplate: (id: number) => Promise<DeleteTemplateResult>;
  clearError: () => void;
}

export const useAvailabilityStore = create<AvailabilityState>((set, get) => ({
  templates: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  loadTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const templates = await fetchTemplates();
      set({ templates, isLoading: false });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to load availability");
      set({
        error: message,
        isLoading: false,
      });
    }
  },

  removeTemplate: async (id: number) => {
    const previous = get().templates;
    set({ templates: previous.filter((t) => t.id !== id), error: null });
    try {
      const result = await deleteTemplateRequest(id);
      await get().loadTemplates();
      return result;
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to delete template");
      set({
        templates: previous, // roll back on failure
        error: message,
      });
      throw new Error(message);
    }
  },
}));