import { create } from "zustand";
import type {
  QuestionBank,
  QuestionBankWithQuestions,
  CreateBankPayload,
  UpdateBankPayload,
  CreateQuestionPayload,
  UpdateQuestionPayload,
} from "../types";
import * as api from "../api/questionBankApi";

type QuestionBankState = {
  banks: QuestionBank[];
  selectedBank: QuestionBankWithQuestions | null;
  isLoading: boolean;
  error: string | null;

  fetchBanks: () => Promise<void>;
  fetchBank: (bankId: number) => Promise<void>;
  createBank: (payload: CreateBankPayload) => Promise<QuestionBank>;
  updateBank: (bankId: number, payload: UpdateBankPayload) => Promise<void>;
  deleteBank: (bankId: number) => Promise<void>;

  addQuestion: (bankId: number, payload: CreateQuestionPayload) => Promise<void>;
  updateQuestion: (
    bankId: number,
    questionId: number,
    payload: UpdateQuestionPayload
  ) => Promise<void>;
  deleteQuestion: (bankId: number, questionId: number) => Promise<void>;
  moveQuestion: (bankId: number, questionId: number, direction: "up" | "down") => Promise<void>;

  clearSelectedBank: () => void;
};

export const useQuestionBankStore = create<QuestionBankState>((set, get) => ({
  banks: [],
  selectedBank: null,
  isLoading: false,
  error: null,

  fetchBanks: async () => {
    set({ isLoading: true, error: null });
    try {
      const banks = await api.listBanks();
      set({ banks, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
    }
  },

  fetchBank: async (bankId) => {
    set({ isLoading: true, error: null });
    try {
      const bank = await api.getBank(bankId);
      set({ selectedBank: bank, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
    }
  },

  createBank: async (payload) => {
    set({ error: null });
    try {
      const bank = await api.createBank(payload);
      set((state) => ({ banks: [...state.banks, bank].sort((a, b) => a.name.localeCompare(b.name)) }));
      return bank;
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  updateBank: async (bankId, payload) => {
    set({ error: null });
    try {
      const updated = await api.updateBank(bankId, payload);
      set((state) => ({
        banks: state.banks.map((b) => (b.id === bankId ? updated : b)),
        selectedBank:
          state.selectedBank?.id === bankId
            ? { ...state.selectedBank, ...updated }
            : state.selectedBank,
      }));
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  deleteBank: async (bankId) => {
    set({ error: null });
    try {
      await api.deleteBank(bankId);
      set((state) => ({ banks: state.banks.filter((b) => b.id !== bankId) }));
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  addQuestion: async (bankId, payload) => {
    set({ error: null });
    try {
      const question = await api.addQuestion(bankId, payload);
      set((state) =>
        state.selectedBank?.id === bankId
          ? { selectedBank: { ...state.selectedBank, questions: [...state.selectedBank.questions, question] } }
          : {}
      );
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  updateQuestion: async (bankId, questionId, payload) => {
    set({ error: null });
    try {
      const updated = await api.updateQuestion(bankId, questionId, payload);
      set((state) =>
        state.selectedBank?.id === bankId
          ? {
              selectedBank: {
                ...state.selectedBank,
                questions: state.selectedBank.questions.map((q) =>
                  q.id === questionId ? updated : q
                ),
              },
            }
          : {}
      );
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  deleteQuestion: async (bankId, questionId) => {
    set({ error: null });
    try {
      await api.deleteQuestion(bankId, questionId);
      set((state) =>
        state.selectedBank?.id === bankId
          ? {
              selectedBank: {
                ...state.selectedBank,
                questions: state.selectedBank.questions.filter((q) => q.id !== questionId),
              },
            }
          : {}
      );
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  // Swaps displayOrder with the neighboring question and sends both to
  // the backend's bulk reorder endpoint — no drag-and-drop library
  // installed, so up/down buttons are the simplest correct UI for this.
  moveQuestion: async (bankId, questionId, direction) => {
    const bank = get().selectedBank;
    if (!bank) return;

    const sorted = [...bank.questions].sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
    );
    const index = sorted.findIndex((q) => q.id === questionId);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || swapIndex < 0 || swapIndex >= sorted.length) return;

    const a = sorted[index];
    const b = sorted[swapIndex];
    const order = [
      { id: a.id, displayOrder: b.displayOrder ?? swapIndex },
      { id: b.id, displayOrder: a.displayOrder ?? index },
    ];

    set({ error: null });
    try {
      const updatedBank = await api.reorderQuestions(bankId, { order });
      set({ selectedBank: updatedBank });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  clearSelectedBank: () => set({ selectedBank: null }),
}));