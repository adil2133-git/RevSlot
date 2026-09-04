import { create } from "zustand";
import type {
  FeedbackForm,
  FeedbackFormWithFields,
  CreateFormPayload,
  UpdateFormPayload,
} from "../types";
import * as api from "../api/feedbackApi";

type FeedbackFormState = {
  forms: FeedbackForm[];
  selectedForm: FeedbackFormWithFields | null;
  isLoading: boolean;
  error: string | null;

  fetchForms: () => Promise<void>;
  fetchForm: (formId: number) => Promise<void>;
  createForm: (payload: CreateFormPayload) => Promise<FeedbackFormWithFields>;
  updateForm: (formId: number, payload: UpdateFormPayload) => Promise<void>;
  deleteForm: (formId: number) => Promise<void>;
  clearSelectedForm: () => void;
};

export const useFeedbackStore = create<FeedbackFormState>((set) => ({
  forms: [],
  selectedForm: null,
  isLoading: false,
  error: null,

  fetchForms: async () => {
    set({ isLoading: true, error: null });
    try {
      const forms = await api.listForms();
      set({ forms, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
    }
  },

  fetchForm: async (formId) => {
    set({ isLoading: true, error: null });
    try {
      const form = await api.getForm(formId);
      set({ selectedForm: form, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
    }
  },

  createForm: async (payload) => {
    set({ error: null });
    try {
      const form = await api.createForm(payload);
      set((state) => ({ forms: [...state.forms, form] }));
      return form;
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  updateForm: async (formId, payload) => {
    set({ error: null });
    try {
      const updated = await api.updateForm(formId, payload);
      set((state) => ({
        forms: state.forms.map((f) => (f.id === formId ? updated : f)),
        selectedForm: state.selectedForm?.id === formId ? updated : state.selectedForm,
      }));
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  // Reviewer can't delete their system-provided default form (isDefault:
  // true) — the backend rejects that (see feedback.service.ts deleteForm)
  // but we surface the error via the store's `error` state either way.
  deleteForm: async (formId) => {
    set({ error: null });
    try {
      await api.deleteForm(formId);
      set((state) => ({ forms: state.forms.filter((f) => f.id !== formId) }));
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  clearSelectedForm: () => set({ selectedForm: null }),
}));