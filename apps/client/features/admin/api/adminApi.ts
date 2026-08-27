import api from "@/lib/axios";
import type {
  ListReviewersParams,
  ListReviewersResponse,
  AdminReviewer,
  ListBookingsParams,
  ListBookingsResponse,
  DashboardStats,
} from "../types";

export async function listReviewers(params: ListReviewersParams = {}) {
  const { data } = await api.get<{ success: boolean; data: ListReviewersResponse }>(
    "/admin/reviewers",
    { params }
  );
  return data.data;
}

export async function updateReviewerStatus(reviewerId: number, isActive: boolean) {
  const { data } = await api.patch<{ success: boolean; data: { reviewer: AdminReviewer } }>(
    `/admin/reviewers/${reviewerId}`,
    { isActive }
  );
  return data.data.reviewer;
}

export async function listBookings(params: ListBookingsParams = {}) {
  const { data } = await api.get<{ success: boolean; data: ListBookingsResponse }>(
    "/admin/bookings",
    { params }
  );
  return data.data;
}

export async function getDashboardStats() {
  const { data } = await api.get<{ success: boolean; data: DashboardStats }>(
    "/admin/dashboard-stats"
  );
  return data.data;
}