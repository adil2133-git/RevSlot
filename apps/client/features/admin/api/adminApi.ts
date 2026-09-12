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
  AnalyticsOverviewData,
  ListFeedbackParams,
  ListFeedbackResponse,
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

export async function listFeedbackHistory(params: ListFeedbackParams = {}) {
  const { data } = await api.get<{ success: boolean; data: ListFeedbackResponse }>(
    "/admin/feedback",
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

export async function getAnalyticsData() {
  const { data } = await api.get<{ success: boolean; data: AnalyticsOverviewData }>(
    "/admin/analytics"
  );
  return data.data;
}

export async function downloadAnalyticsCSV() {
  const response = await api.get("/admin/analytics/export/csv", {
    responseType: "blob",
  });
  const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `analytics_overview_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
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