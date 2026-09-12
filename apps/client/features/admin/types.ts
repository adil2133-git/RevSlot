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

export type AdminProfile = {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string | null;
};

export type UpdateAdminProfileInput = {
  name?: string;
  bio?: string;
  avatarUrl?: string;
  currentPassword?: string;
  newPassword?: string;
};

export type AuditLogEntry = {
  id: number;
  actorId: number;
  actorRole: "reviewer" | "admin";
  actorName: string;
  action: string;
  targetType: string | null;
  targetId: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type ListAuditLogParams = {
  action?: string;
  actorId?: number;
  targetType?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
};

export type ListAuditLogResponse = {
  logs: AuditLogEntry[];
  pagination: Pagination;
};

export type KPIMetric = {
  current: number;
  previous: number;
  changePct: number;
  direction: "up" | "down" | "flat";
};

export type KPINoShowMetric = {
  currentPct: number;
  previousPct: number;
  changePct: number;
  direction: "up" | "down" | "flat";
};

export type KPITurnaroundMetric = {
  currentHours: number;
  previousHours: number;
  changeHours: number;
  direction: "up" | "down" | "flat";
};

export type ReviewerBookingStat = {
  reviewerId: number;
  name: string;
  count: number;
  pct: number;
};

export type ReviewerNoShowStat = {
  reviewerId: number;
  name: string;
  total: number;
  noShows: number;
  ratePct: number;
  status: "good" | "moderate" | "high";
};

export type TechStackStat = {
  name: string;
  count: number;
  percentage: number;
  color: string;
};

export type AnalyticsOverviewData = {
  kpis: {
    weeklyBookings: KPIMetric;
    noShowRate: KPINoShowMetric;
    avgFeedbackTurnaround: KPITurnaroundMetric;
  };
  bookingsPerReviewer: ReviewerBookingStat[];
  noShowRatePerReviewer: ReviewerNoShowStat[];
  popularTechStacks: TechStackStat[];
};

export type AdminFeedbackHistoryItem = {
  id: number;
  bookingId: number;
  reviewerId: number;
  reviewerName: string;
  reviewerDepartment: string | null;
  internName: string;
  advisorName: string;
  formId: number;
  formName: string;
  isNoShow: boolean;
  reviewMark: string | null;
  taskMark: string | null;
  comments: string | null;
  understandingLevel: string | null;
  customFieldValues: Record<string, any> | null;
  submittedAt: string;
};

export type ListFeedbackParams = {
  search?: string;
  reviewerId?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
};

export type ListFeedbackResponse = {
  feedback: AdminFeedbackHistoryItem[];
  pagination: Pagination;
};