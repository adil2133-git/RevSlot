import { create } from "zustand";
import type {
  FeedbackForm,
  FeedbackFormWithFields,
  CreateFormPayload,
  UpdateFormPayload,
  FeedbackListItem,
  ListFeedbackParams,
  PendingFeedbackItem,
  DeleteFormResult,
} from "../types";
import * as api from "../api/feedbackApi";

const SYSTEM_FIELD_LABELS = new Set([
  "Strengths",
  "Areas for Improvement",
  "Recommendations / Next Steps",
]);

type FeedbackFormState = {
  forms: FeedbackForm[];
  selectedForm: FeedbackFormWithFields | null;
  isLoading: boolean;
  error: string | null;

  fetchForms: (includeArchived?: boolean) => Promise<void>;
  fetchForm: (formId: number) => Promise<void>;
  createForm: (payload: CreateFormPayload) => Promise<FeedbackFormWithFields>;
  updateForm: (formId: number, payload: UpdateFormPayload) => Promise<void>;
  deleteForm: (formId: number) => Promise<DeleteFormResult>;
  reactivateForm: (formId: number) => Promise<void>;
  clearSelectedForm: () => void;
  recentFeedback: FeedbackListItem[];
  isRecentLoading: boolean;
  fetchRecentFeedback: () => Promise<void>;
  feedbackList: FeedbackListItem[];
  feedbackListTotal: number;
  feedbackListPage: number;
  feedbackListPageSize: number;
  isFeedbackListLoading: boolean;
  fetchFeedbackList: (params?: ListFeedbackParams) => Promise<void>;
  pendingFeedback: PendingFeedbackItem[];
  isPendingLoading: boolean;
  fetchPendingFeedback: () => Promise<void>;
  duplicateForm: (formId: number, name: string) => Promise<FeedbackFormWithFields>;
};

export const useFeedbackStore = create<FeedbackFormState>((set) => ({
  forms: [],
  selectedForm: null,
  isLoading: false,
  error: null,

  fetchForms: async (includeArchived = false) => {
    set({ isLoading: true, error: null });
    try {
      const forms = await api.listForms(includeArchived);
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
      const result = await api.deleteForm(formId);
       if (result.archived) {
        set((state) => ({
          forms: state.forms.map((f) => (f.id === formId ? { ...f, isActive: false } : f)),
        }));
      } else {
        set((state) => ({ forms: state.forms.filter((f) => f.id !== formId) }));
      }
      return result;
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  clearSelectedForm: () => set({ selectedForm: null }),

  recentFeedback: [],
  isRecentLoading: false,
  fetchRecentFeedback: async () => {
    set({ isRecentLoading: true });
    try {
      const { items } = await api.listFeedback({ pageSize: 5, page: 1 });
      set({ recentFeedback: items, isRecentLoading: false });
    } catch (err) {
      set({ isRecentLoading: false, error: (err as Error).message });
    }
  },

  feedbackList: [],
  feedbackListTotal: 0,
  feedbackListPage: 1,
  feedbackListPageSize: 20,
  isFeedbackListLoading: false,
  fetchFeedbackList: async (params) => {
    set({ isFeedbackListLoading: true });
    try {
      const result = await api.listFeedback(params);
      set({
        feedbackList: result.items,
        feedbackListTotal: result.total,
        feedbackListPage: result.page,
        feedbackListPageSize: result.pageSize,
        isFeedbackListLoading: false,
      });
    } catch (err) {
      set({ isFeedbackListLoading: false, error: (err as Error).message });
    }
  },

  pendingFeedback: [],
  isPendingLoading: false,
  fetchPendingFeedback: async () => {
    set({ isPendingLoading: true });
    try {
      const items = await api.listPendingFeedback();
      set({ pendingFeedback: items, isPendingLoading: false });
    } catch (err) {
      set({ isPendingLoading: false, error: (err as Error).message });
    }
  },

  reactivateForm: async (formId) => {
    set({ error: null });
    try {
      const updated = await api.reactivateForm(formId);
      set((state) => ({
        forms: state.forms.map((f) => (f.id === formId ? updated : f)),
        selectedForm: state.selectedForm?.id === formId ? updated : state.selectedForm,
      }));
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  }, 


  duplicateForm: async (formId, name) => {
    set({ error: null });
    try {
      const source = await api.getForm(formId);
      const customFields = source.fields.filter((field) => !SYSTEM_FIELD_LABELS.has(field.label));
      const created = await api.createForm({
        name,
        taskMarkEnabled: source.taskMarkEnabled,
        fields: customFields.map((field, index) => ({
          label: field.label,
          fieldType: field.fieldType,
          options: field.options ?? undefined,
          required: field.required,
          displayOrder: index,
        })),
        questionIds: source.questions.map((question) => question.id),
      });
      set((state) => ({ forms: [...state.forms, created] }));
      return created;
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

}));