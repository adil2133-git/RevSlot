import { z } from "zod";

export const GetAnalyticsQuerySchema = z.object({
  range: z.enum(["7d", "30d", "90d", "this_month", "all"]).optional().default("7d"),
  fromDate: z.string().date().optional(),
  toDate: z.string().date().optional(),
});

export type GetAnalyticsQuery = z.infer<typeof GetAnalyticsQuerySchema>;

export interface KpiSummary {
  weeklyBookings: number;
  bookingsChangePct: number | null;
  overallNoShowRatePct: number;
  noShowRateDeltaPct: number | null;
  avgFeedbackTurnaroundHours: number;
  turnaroundDeltaHours: number | null;
  totalCompletedReviews: number;
  activeReviewers: number;
}

export interface ReviewerBookingStat {
  reviewerId: number;
  reviewerName: string;
  email: string;
  bookingCount: number;
  completedCount: number;
  noShowCount: number;
  percentageOfMax: number;
}

export interface ReviewerNoShowStat {
  reviewerId: number;
  reviewerName: string;
  email: string;
  noShowRatePct: number;
  noShowCount: number;
  completedCount: number;
  totalSessions: number;
}

export interface TechStackStat {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface AnalyticsResponseData {
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
}
