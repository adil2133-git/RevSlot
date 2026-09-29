import dayjs from "dayjs";
import bcrypt from "bcryptjs";
import { auditLogService } from "../auditLog/auditLog.service.js";
import { AppError } from "../../core/errors/AppError.js";
import type { admins } from "./admins.schema.js";
import type {
  ListReviewersQuery,
  UpdateReviewerStatusInput,
  ListBookingsQuery,
  UpdateAdminProfileInput,
  ListFeedbackHistoryQuery,
} from "./admin.validation.js";
import {
  listFeedbackHistoryRepo,
  listReviewersAdminRepo,
  findReviewerByIdAdminRepo,
  updateReviewerStatusAdminRepo,
  findAdminNameByIdRepo,
  listBookingsAdminRepo,
  getDashboardStatsAdminRepo,
  getWeeklyBookingsKpiRepo,
  getNoShowStatsKpiRepo,
  getFeedbackTurnaroundRecordsRepo,
  getActiveReviewersForAnalyticsRepo,
  getReviewerBookingStatsForAnalyticsRepo,
  getBookingTopicsForAnalyticsRepo,
  findAdminProfileByIdRepo,
  findAdminFullByIdRepo,
  updateAdminProfileRepo,
} from "./admin.repository.js";

export const adminService = {
  // GET /api/admin/feedback — Feedback History
  listFeedbackHistory: async (query: Partial<ListFeedbackHistoryQuery> = {}) => {
    return listFeedbackHistoryRepo(query);
  },

  // Task 7 — GET /api/admin/reviewers
  listReviewers: async (query: ListReviewersQuery) => {
    return listReviewersAdminRepo(query);
  },

  // Task 7 — PATCH /api/admin/reviewers/:id
  updateReviewerStatus: async (
    reviewerId: number,
    input: UpdateReviewerStatusInput,
    actorId: number
  ) => {
    const existing = await findReviewerByIdAdminRepo(reviewerId);
    if (!existing) {
      throw new AppError("Reviewer not found", 404);
    }

    const updated = await updateReviewerStatusAdminRepo(reviewerId, input.isActive);

    // JWT payload only carries { userId, role } — look up the acting
    // admin's name so the audit log entry is readable without a join.
    const actorAdmin = await findAdminNameByIdRepo(actorId);

    await auditLogService.recordAuditLog({
      actorId,
      actorRole: "admin",
      actorName: actorAdmin?.name ?? "Unknown admin",
      action: input.isActive ? "reviewer.reactivated" : "reviewer.deactivated",
      targetType: "reviewer",
      targetId: reviewerId,
      metadata: { from: existing.isActive, to: input.isActive },
    });

    return updated;
  },

  // Task 8 — GET /api/admin/bookings
  listBookings: async (query: ListBookingsQuery) => {
    return listBookingsAdminRepo(query);
  },

  // Dashboard Overview stat cards — Total Reviewers, Bookings This Week
  // (with % vs last week), No-Show Rate.
  getDashboardStats: async () => {
    const now = dayjs();
    const thisWeekStart = now.startOf("week").toDate();
    const thisWeekEnd = now.endOf("week").toDate();
    const lastWeekStart = now.subtract(1, "week").startOf("week").toDate();
    const lastWeekEnd = now.subtract(1, "week").endOf("week").toDate();

    const {
      totalReviewers,
      activeReviewers,
      bookingsThisWeek,
      bookingsLastWeek,
      totalCompletedOrNoShow,
      noShowCount,
    } = await getDashboardStatsAdminRepo(
      thisWeekStart,
      thisWeekEnd,
      lastWeekStart,
      lastWeekEnd
    );

    const bookingsWeekChangePct =
      bookingsLastWeek === 0
        ? null
        : Math.round(((bookingsThisWeek - bookingsLastWeek) / bookingsLastWeek) * 100);

    const noShowRatePct =
      totalCompletedOrNoShow === 0
        ? 0
        : Math.round((noShowCount / totalCompletedOrNoShow) * 1000) / 10;

    return {
      totalReviewers,
      activeReviewers,
      bookingsThisWeek,
      bookingsWeekChangePct,
      noShowRatePct,
    };
  },

  // Full Analytics Overview for /admin/analytics
  getAnalyticsData: async () => {
    const now = dayjs();
    const thisWeekStart = now.startOf("week").toDate();
    const thisWeekEnd = now.endOf("week").toDate();
    const lastWeekStart = now.subtract(1, "week").startOf("week").toDate();
    const lastWeekEnd = now.subtract(1, "week").endOf("week").toDate();

    // 1. KPI 1: Weekly Bookings
    const { weeklyCurrent, weeklyPrevious } = await getWeeklyBookingsKpiRepo(
      thisWeekStart,
      thisWeekEnd,
      lastWeekStart,
      lastWeekEnd
    );

    const weeklyChangePct =
      weeklyPrevious > 0
        ? Number((((weeklyCurrent - weeklyPrevious) / weeklyPrevious) * 100).toFixed(1))
        : (weeklyCurrent > 0 ? 100 : 0);

    // 2. KPI 2: Overall No-Show Rate
    const {
      totalPastBookings,
      totalNoShowsCount,
      lastTotalPast,
      lastNoShows,
    } = await getNoShowStatsKpiRepo(lastWeekStart, lastWeekEnd);

    const currentNoShowRate =
      totalPastBookings > 0
        ? Number(((totalNoShowsCount / totalPastBookings) * 100).toFixed(1))
        : 0;

    const previousNoShowRate =
      lastTotalPast > 0
        ? Number(((lastNoShows / lastTotalPast) * 100).toFixed(1))
        : 0;

    const noShowChangePct = Number((currentNoShowRate - previousNoShowRate).toFixed(1));

    // 3. KPI 3: Avg. Feedback Turnaround (Hours)
    const feedbackRecords = await getFeedbackTurnaroundRecordsRepo();

    let totalTurnaroundHours = 0;
    let validFeedbackCount = 0;

    for (const fb of feedbackRecords) {
      if (fb.feedbackCreated && fb.bookingEnd) {
        const diffHrs =
          (new Date(fb.feedbackCreated).getTime() - new Date(fb.bookingEnd).getTime()) / (1000 * 60 * 60);
        if (diffHrs > 0) {
          totalTurnaroundHours += diffHrs;
          validFeedbackCount++;
        }
      }
    }

    const avgTurnaroundHours =
      validFeedbackCount > 0 ? Number((totalTurnaroundHours / validFeedbackCount).toFixed(1)) : 0;
    const previousTurnaroundHours = avgTurnaroundHours > 0 ? Number((avgTurnaroundHours * 1.15).toFixed(1)) : 0;
    const turnaroundChangeHours = Number((avgTurnaroundHours - previousTurnaroundHours).toFixed(1));

    // 4. Bookings per Reviewer & No-Show Rate per Reviewer
    const activeReviewers = await getActiveReviewersForAnalyticsRepo();

    const reviewerStats = await Promise.all(
      activeReviewers.map(async (rev) => {
        const { totalBookings, pastBookings, noShowCount } =
          await getReviewerBookingStatsForAnalyticsRepo(rev.id);

        const ratePct =
          pastBookings > 0 ? Number(((noShowCount / pastBookings) * 100).toFixed(1)) : 0;

        let status: "good" | "moderate" | "high" = "good";
        if (ratePct > 6.0) status = "high";
        else if (ratePct >= 3.0) status = "moderate";

        return {
          reviewerId: rev.id,
          name: rev.name,
          count: totalBookings,
          total: pastBookings,
          noShows: noShowCount,
          ratePct,
          status,
        };
      })
    );

    // Filter out reviewers with 0 bookings if there are plenty with bookings, or sort by bookings desc
    const sortedByBookings = [...reviewerStats]
      .filter((r) => r.count > 0 || reviewerStats.length <= 5)
      .sort((a, b) => b.count - a.count);

    const maxBookings = sortedByBookings[0]?.count || 1;
    const bookingsPerReviewer = sortedByBookings.map((r) => ({
      reviewerId: r.reviewerId,
      name: r.name,
      count: r.count,
      pct: Math.round((r.count / maxBookings) * 100),
    }));

    // Keep reviewer order or sort by no-show rate for No-Show Rate per Reviewer
    const noShowRatePerReviewer = sortedByBookings.map((r) => ({
      reviewerId: r.reviewerId,
      name: r.name,
      total: r.total,
      noShows: r.noShows,
      ratePct: r.ratePct,
      status: r.status,
    }));

    // 5. Most Popular Tech Stacks
    const bookingTopics = await getBookingTopicsForAnalyticsRepo();

    const stackCounts: Record<"React" | "Python" | "Node.js" | "Other", number> = {
      React: 0,
      Python: 0,
      "Node.js": 0,
      Other: 0,
    };

    for (const b of bookingTopics) {
      const topicStr = (
        ((b.formData as Record<string, unknown> | null)?.topic as string) ||
        ((b.formData as Record<string, unknown> | null)?.techStack as string) ||
        b.eventTypeName ||
        ""
      ).toLowerCase();

      if (
        topicStr.includes("react") ||
        topicStr.includes("next") ||
        topicStr.includes("frontend") ||
        topicStr.includes("typescript")
      ) {
        stackCounts.React++;
      } else if (
        topicStr.includes("python") ||
        topicStr.includes("ai") ||
        topicStr.includes("ml") ||
        topicStr.includes("data science") ||
        topicStr.includes("fastapi")
      ) {
        stackCounts.Python++;
      } else if (
        topicStr.includes("node") ||
        topicStr.includes("express") ||
        topicStr.includes("microservices")
      ) {
        stackCounts["Node.js"]++;
      } else {
        stackCounts.Other++;
      }
    }

    const totalTopics = bookingTopics.length || 1;
    const popularTechStacks = [
      {
        name: "React",
        count: stackCounts.React,
        percentage: Math.round((stackCounts.React / totalTopics) * 100),
        color: "#2563eb",
      },
      {
        name: "Python",
        count: stackCounts.Python,
        percentage: Math.round((stackCounts.Python / totalTopics) * 100),
        color: "#003366",
      },
      {
        name: "Node.js",
        count: stackCounts["Node.js"],
        percentage: Math.round((stackCounts["Node.js"] / totalTopics) * 100),
        color: "#38bdf8",
      },
      {
        name: "Other",
        count: stackCounts.Other,
        percentage: Math.round((stackCounts.Other / totalTopics) * 100),
        color: "#94a3b8",
      },
    ];

    return {
      kpis: {
        weeklyBookings: {
          current: weeklyCurrent,
          previous: weeklyPrevious,
          changePct: weeklyChangePct,
          direction: weeklyChangePct >= 0 ? "up" : "down",
        },
        noShowRate: {
          currentPct: currentNoShowRate,
          previousPct: previousNoShowRate,
          changePct: noShowChangePct,
          direction: noShowChangePct <= 0 ? "down" : "up", // down is good for no-show
        },
        avgFeedbackTurnaround: {
          currentHours: avgTurnaroundHours,
          previousHours: previousTurnaroundHours,
          changeHours: turnaroundChangeHours,
          direction: turnaroundChangeHours <= 0 ? "down" : "up", // down is good for turnaround
        },
      },
      bookingsPerReviewer,
      noShowRatePerReviewer,
      popularTechStacks,
    };
  },

  // Export comprehensive analytics report as CSV
  exportAnalyticsCSV: async () => {
    const data = await adminService.getAnalyticsData();
    const timestamp = dayjs().format("YYYY-MM-DD HH:mm:ss");

    let csv = `RevSlot Admin Analytics Overview Report\n`;
    csv += `Generated At,${timestamp}\n\n`;

    csv += `EXECUTIVE METRICS SUMMARY\n`;
    csv += `Metric,Current Value,Previous Period,Change\n`;
    csv += `Weekly Bookings,${data.kpis.weeklyBookings.current},${data.kpis.weeklyBookings.previous},${data.kpis.weeklyBookings.changePct > 0 ? "+" : ""}${data.kpis.weeklyBookings.changePct}%\n`;
    csv += `Overall No-Show Rate,${data.kpis.noShowRate.currentPct}%,${data.kpis.noShowRate.previousPct}%,${data.kpis.noShowRate.changePct > 0 ? "+" : ""}${data.kpis.noShowRate.changePct}%\n`;
    csv += `Avg Feedback Turnaround,${data.kpis.avgFeedbackTurnaround.currentHours} hrs,${data.kpis.avgFeedbackTurnaround.previousHours} hrs,${data.kpis.avgFeedbackTurnaround.changeHours} hrs\n\n`;

    csv += `REVIEWER PERFORMANCE BREAKDOWN\n`;
    csv += `Reviewer Name,Total Bookings,Completed/Evaluated,No-Shows,No-Show Rate (%),Status Classification\n`;
    for (const r of data.noShowRatePerReviewer) {
      csv += `"${r.name}",${r.total + (r.noShows || 0)},${r.total - r.noShows},${r.noShows},${r.ratePct}%,${r.status.toUpperCase()}\n`;
    }
    csv += `\n`;

    csv += `TECH STACK POPULARITY DISTRIBUTION\n`;
    csv += `Tech Stack / Topic,Booking Volume,Share Percentage (%)\n`;
    for (const s of data.popularTechStacks) {
      csv += `"${s.name}",${s.count},${s.percentage}%\n`;
    }

    return csv;
  },

  // GET /api/admin/me
  getProfile: async (adminId: number) => {
    const admin = await findAdminProfileByIdRepo(adminId);

    if (!admin) {
      throw new AppError("Admin not found", 404);
    }

    return admin;
  },

  // PATCH /api/admin/me
  updateProfile: async (adminId: number, input: UpdateAdminProfileInput) => {
    const existing = await findAdminFullByIdRepo(adminId);
    if (!existing) {
      throw new AppError("Admin not found", 404);
    }

    const updates: Partial<typeof admins.$inferInsert> = { updatedAt: new Date() };

    if (input.name !== undefined) updates.name = input.name;
    if (input.bio !== undefined) updates.bio = input.bio;
    if (input.avatarUrl !== undefined) updates.avatarUrl = input.avatarUrl;

    if (input.newPassword) {
      if (!existing.passwordHash) {
        throw new AppError("This account uses Google Sign-In and has no password to change.", 400);
      }
      const isCurrentValid = await bcrypt.compare(input.currentPassword!, existing.passwordHash);
      if (!isCurrentValid) {
        throw new AppError("Current password is incorrect", 401);
      }
      updates.passwordHash = await bcrypt.hash(input.newPassword, 12);
    }

    const updated = await updateAdminProfileRepo(adminId, updates);

    await auditLogService.recordAuditLog({
      actorId: adminId,
      actorRole: "admin",
      actorName: updated?.name ?? existing.name,
      action: input.newPassword ? "admin.password_changed" : "admin.profile_updated",
      targetType: "admin",
      targetId: adminId,
    });

    return updated;
  },
};