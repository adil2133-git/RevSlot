import api from "@/lib/axios";
import type {
  ListReviewersParams,
  ListReviewersResponse,
  AdminReviewer,
  ListBookingsParams,
  ListBookingsResponse,
  DashboardStats,
  AdminProfile,
  UpdateAdminProfileInput,
  ListAuditLogParams,
  ListAuditLogResponse,
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

export async function getProfile() {
  const { data } = await api.get<{ success: boolean; data: { admin: AdminProfile } }>(
    "/admin/me"
  );
  return data.data.admin;
}

export async function updateProfile(input: UpdateAdminProfileInput) {
  const { data } = await api.patch<{ success: boolean; data: { admin: AdminProfile } }>(
    "/admin/me",
    input
  );
  return data.data.admin;
}

export async function listAuditLog(params: ListAuditLogParams = {}) {
  const { data } = await api.get<{ success: boolean; data: ListAuditLogResponse }>(
    "/admin/audit-log",
    { params }
  );
  return data.data;
}