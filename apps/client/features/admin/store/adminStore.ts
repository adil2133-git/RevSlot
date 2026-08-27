import { create } from "zustand";
import type {
  AdminReviewer,
  AdminBooking,
  Pagination,
  ListReviewersParams,
  ListBookingsParams,
  DashboardStats,
} from "../types";
import * as api from "../api/adminApi";

type AdminState = {
  reviewers: AdminReviewer[];
  reviewersPagination: Pagination | null;
  bookings: AdminBooking[];
  bookingsPagination: Pagination | null;
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;

  fetchReviewers: (params?: ListReviewersParams) => Promise<void>;
  toggleReviewerStatus: (reviewerId: number, isActive: boolean) => Promise<void>;
  fetchBookings: (params?: ListBookingsParams) => Promise<void>;
  fetchStats: () => Promise<void>;
};

export const useAdminStore = create<AdminState>((set) => ({
  reviewers: [],
  reviewersPagination: null,
  bookings: [],
  bookingsPagination: null,
  stats: null,
  isLoading: false,
  error: null,

  fetchReviewers: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const { reviewers, pagination } = await api.listReviewers(params);
      set({ reviewers, reviewersPagination: pagination, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
    }
  },

  // Optimistic-ish: re-fetch is avoided — just patch the single row in
  // place so the table doesn't jump/reset scroll or pagination.
  toggleReviewerStatus: async (reviewerId, isActive) => {
    set({ error: null });
    try {
      const updated = await api.updateReviewerStatus(reviewerId, isActive);
      set((state) => ({
        reviewers: state.reviewers.map((r) =>
          r.id === reviewerId ? { ...r, isActive: updated.isActive } : r
        ),
      }));
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  fetchBookings: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const { bookings, pagination } = await api.listBookings(params);
      set({ bookings, bookingsPagination: pagination, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
    }
  },

  fetchStats: async () => {
    set({ error: null });
    try {
      const stats = await api.getDashboardStats();
      set({ stats });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
}));