export type AdminReviewer = {
  id: number;
  name: string;
  email: string;
  whatsappNumber: string;
  isActive: boolean | null;
  emailVerified: boolean;
  createdAt: string | null;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ListReviewersParams = {
  search?: string;
  status?: "active" | "inactive" | "all";
  page?: number;
  limit?: number;
};

export type ListReviewersResponse = {
  reviewers: AdminReviewer[];
  pagination: Pagination;
};

export type BookingStatus = "confirmed" | "cancelled" | "completed" | "no_show" | "rescheduled";

export type AdminBooking = {
  id: number;
  internName: string;
  batch: string;
  advisorEmail: string;
  weekStage: string;
  startTime: string;
  endTime: string;
  status: BookingStatus | null;
  reviewerId: number;
  reviewerName: string;
  eventTypeName: string;
};

export type ListBookingsParams = {
  status?: BookingStatus;
  reviewerId?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
};

export type ListBookingsResponse = {
  bookings: AdminBooking[];
  pagination: Pagination;
};

export type DashboardStats = {
  totalReviewers: number;
  activeReviewers: number;
  bookingsThisWeek: number;
  bookingsWeekChangePct: number | null;
  noShowRatePct: number;
};