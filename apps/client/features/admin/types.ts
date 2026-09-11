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

export type AnalyticsRange = "7d" | "30d" | "90d" | "this_month" | "all";

export type AnalyticsQueryParams = {
  range?: AnalyticsRange;
  fromDate?: string;
  toDate?: string;
};

export type KpiSummary = {
  weeklyBookings: number;
  bookingsChangePct: number | null;
  overallNoShowRatePct: number;
  noShowRateDeltaPct: number | null;
  avgFeedbackTurnaroundHours: number;
  turnaroundDeltaHours: number | null;
  totalCompletedReviews: number;
  activeReviewers: number;
};

export type ReviewerBookingStat = {
  reviewerId: number;
  reviewerName: string;
  email: string;
  bookingCount: number;
  completedCount: number;
  noShowCount: number;
  percentageOfMax: number;
};

export type ReviewerNoShowStat = {
  reviewerId: number;
  reviewerName: string;
  email: string;
  noShowRatePct: number;
  noShowCount: number;
  completedCount: number;
  totalSessions: number;
};

export type TechStackStat = {
  name: string;
  count: number;
  percentage: number;
  color: string;
};

export type AnalyticsData = {
  timeframe: {
    range: string;
    startDate: string;
    endDate: string;
    prevStartDate: string;
    prevEndDate: string;
  };
  kpis: KpiSummary;
  bookingsPerReviewer: ReviewerBookingStat[];
  noShowRatePerReviewer: ReviewerNoShowStat[];
  popularTechStacks: TechStackStat[];
};

export type AdminFeedbackItem = {
  id: number;
  bookingId: number;
  reviewerId: number;
  reviewerName: string;
  reviewerEmail: string;
  reviewerBio: string | null;
  internName: string;
  advisorName: string;
  advisorEmail: string;
  batch: string;
  weekStage: string;
  formId: number | null;
  formName: string | null;
  eventTypeName: string | null;
  isNoShow: boolean;
  reviewMark: string | null;
  taskMark: string | null;
  understandingLevel: string | null;
  comments: string | null;
  customFieldValues: Record<string, any> | null;
  createdAt: string;
  sessionStartTime: string;
  sessionEndTime: string;
};

export type AdminFeedbackDetails = AdminFeedbackItem & {
  taskMarkEnabled: boolean | null;
  updatedAt?: string | null;
  customFields: Array<{
    id: number;
    label: string;
    fieldType: string;
    value: string;
    options?: string[] | null;
  }>;
  pendingQuestions: Array<{
    id: number;
    questionId: number;
    questionText: string;
    description: string | null;
    status: string;
    assignedAt: string;
    completedAt: string | null;
  }>;
};

export type ListAdminFeedbackParams = {
  search?: string;
  reviewerId?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
};

export type ListAdminFeedbackResponse = {
  submissions: AdminFeedbackItem[];
  pagination: Pagination;
};