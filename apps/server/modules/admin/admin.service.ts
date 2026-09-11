import dayjs from "dayjs";
import bcrypt from "bcryptjs";
import { eq, and, or, ilike, sql, gte, lte, desc, asc, count } from "drizzle-orm";
import { db } from "../../config/db.js";
import { reviewers } from "../auth/reviewers.model.js";
import { bookings } from "../booking/bookings.schema.js";
import { eventTypes } from "../eventType/eventTypes.model.js";
import { feedback, feedbackForms, feedbackPendingQuestions } from "../feedback/feedback.model.js";
import { questions } from "../questionBank/questions.model.js";
import { admins } from "./admins.model.js";
import { auditLogService } from "../auditLog/auditLog.service.js";
import { AppError } from "../../core/errors/AppError.js";
import type {
  ListReviewersQuery,
  UpdateReviewerStatusInput,
  ListBookingsQuery,
  UpdateAdminProfileInput,
  ListAdminFeedbackQuery,
} from "./admin.schema.js";
import type {
  GetAnalyticsQuery,
  AnalyticsResponseData,
  ReviewerBookingStat,
  ReviewerNoShowStat,
  TechStackStat,
} from "./analytics.schema.js";

export const adminService = {
  // Task 7 — GET /api/admin/reviewers
  listReviewers: async (query: ListReviewersQuery) => {
    const { search, status, page, limit } = query;

    const conditions = [];
    if (search) {
      conditions.push(
        or(ilike(reviewers.name, `%${search}%`), ilike(reviewers.email, `%${search}%`))
      );
    }
    if (status === "active") conditions.push(eq(reviewers.isActive, true));
    if (status === "inactive") conditions.push(eq(reviewers.isActive, false));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, totalResult] = await Promise.all([
      db
        .select({
          id: reviewers.id,
          name: reviewers.name,
          email: reviewers.email,
          whatsappNumber: reviewers.whatsappNumber,
          isActive: reviewers.isActive,
          emailVerified: reviewers.emailVerified,
          createdAt: reviewers.createdAt,
        })
        .from(reviewers)
        .where(where)
        .orderBy(desc(reviewers.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ total: count() }).from(reviewers).where(where),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return {
      reviewers: rows,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  },

  // Task 7 — PATCH /api/admin/reviewers/:id
  updateReviewerStatus: async (
    reviewerId: number,
    input: UpdateReviewerStatusInput,
    actorId: number
  ) => {
    const [existing] = await db.select().from(reviewers).where(eq(reviewers.id, reviewerId));
    if (!existing) {
      throw new AppError("Reviewer not found", 404);
    }

    const [updated] = await db
      .update(reviewers)
      .set({ isActive: input.isActive, updatedAt: new Date() })
      .where(eq(reviewers.id, reviewerId))
      .returning({
        id: reviewers.id,
        name: reviewers.name,
        email: reviewers.email,
        isActive: reviewers.isActive,
      });

    // JWT payload only carries { userId, role } — look up the acting
    // admin's name so the audit log entry is readable without a join.
    const [actorAdmin] = await db.select({ name: admins.name }).from(admins).where(eq(admins.id, actorId));

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
    const { status, reviewerId, fromDate, toDate, page, limit } = query;

    const conditions = [];
    if (status) conditions.push(eq(bookings.status, status));
    if (reviewerId) conditions.push(eq(bookings.reviewerId, reviewerId));
    if (fromDate) conditions.push(gte(bookings.startTime, dayjs(fromDate).startOf("day").toDate()));
    if (toDate) conditions.push(lte(bookings.startTime, dayjs(toDate).endOf("day").toDate()));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, totalResult] = await Promise.all([
      db
        .select({
          id: bookings.id,
          internName: bookings.internName,
          batch: bookings.batch,
          advisorEmail: bookings.advisorEmail,
          weekStage: bookings.weekStage,
          startTime: bookings.startTime,
          endTime: bookings.endTime,
          status: bookings.status,
          reviewerId: bookings.reviewerId,
          reviewerName: reviewers.name,
          eventTypeName: eventTypes.name,
        })
        .from(bookings)
        .innerJoin(reviewers, eq(bookings.reviewerId, reviewers.id))
        .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
        .where(where)
        .orderBy(desc(bookings.startTime))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ total: count() }).from(bookings).where(where),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return {
      bookings: rows,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  },

  // Dashboard Overview stat cards — Total Reviewers, Bookings This Week
  // (with % vs last week), No-Show Rate. Kept as one combined query set
  // rather than a full analytics module, since this is only for the
  // three cards on the Stitch design, not the separate Analytics page.
  getDashboardStats: async () => {
    const now = dayjs();
    const thisWeekStart = now.startOf("week").toDate();
    const thisWeekEnd = now.endOf("week").toDate();
    const lastWeekStart = now.subtract(1, "week").startOf("week").toDate();
    const lastWeekEnd = now.subtract(1, "week").endOf("week").toDate();

    const [
      totalReviewersResult,
      activeReviewersResult,
      bookingsThisWeekResult,
      bookingsLastWeekResult,
      totalCompletedOrNoShowResult,
      noShowCountResult,
    ] = await Promise.all([
      db.select({ totalReviewers: count() }).from(reviewers),
      db.select({ activeReviewers: count() }).from(reviewers).where(eq(reviewers.isActive, true)),
      db
        .select({ bookingsThisWeek: count() })
        .from(bookings)
        .where(and(gte(bookings.startTime, thisWeekStart), lte(bookings.startTime, thisWeekEnd))),
      db
        .select({ bookingsLastWeek: count() })
        .from(bookings)
        .where(and(gte(bookings.startTime, lastWeekStart), lte(bookings.startTime, lastWeekEnd))),
      // No-show rate is computed over bookings that have actually happened
      // (completed or no_show) — confirmed/upcoming bookings haven't had
      // the chance to no-show yet, so including them would understate the rate.
      db
        .select({ totalCompletedOrNoShow: count() })
        .from(bookings)
        .where(sql`${bookings.status} IN ('completed', 'no_show')`),
      db.select({ noShowCount: count() }).from(bookings).where(eq(bookings.status, "no_show")),
    ]);

    const totalReviewers = totalReviewersResult[0]?.totalReviewers ?? 0;
    const activeReviewers = activeReviewersResult[0]?.activeReviewers ?? 0;
    const bookingsThisWeek = bookingsThisWeekResult[0]?.bookingsThisWeek ?? 0;
    const bookingsLastWeek = bookingsLastWeekResult[0]?.bookingsLastWeek ?? 0;
    const totalCompletedOrNoShow = totalCompletedOrNoShowResult[0]?.totalCompletedOrNoShow ?? 0;
    const noShowCount = noShowCountResult[0]?.noShowCount ?? 0;

    const bookingsWeekChangePct =
      bookingsLastWeek === 0
        ? null // no baseline to compare against
        : Math.round(((bookingsThisWeek - bookingsLastWeek) / bookingsLastWeek) * 100);

    const noShowRatePct =
      totalCompletedOrNoShow === 0
        ? 0
        : Math.round((noShowCount / totalCompletedOrNoShow) * 1000) / 10; // one decimal

    return {
      totalReviewers,
      activeReviewers,
      bookingsThisWeek,
      bookingsWeekChangePct,
      noShowRatePct,
    };
  },

  // GET /api/admin/me
  getProfile: async (adminId: number) => {
    const [admin] = await db
      .select({
        id: admins.id,
        name: admins.name,
        email: admins.email,
        avatarUrl: admins.avatarUrl,
        bio: admins.bio,
        createdAt: admins.createdAt,
      })
      .from(admins)
      .where(eq(admins.id, adminId));

    if (!admin) {
      throw new AppError("Admin not found", 404);
    }

    return admin;
  },

  // PATCH /api/admin/me — name/bio/avatar always updatable; password change
  // requires currentPassword (checked here, not just at the schema level,
  // since the schema can only confirm both fields were sent together, not
  // that currentPassword is actually correct).
  updateProfile: async (adminId: number, input: UpdateAdminProfileInput) => {
    const [existing] = await db.select().from(admins).where(eq(admins.id, adminId));
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

    const [updated] = await db
      .update(admins)
      .set(updates)
      .where(eq(admins.id, adminId))
      .returning({
        id: admins.id,
        name: admins.name,
        email: admins.email,
        avatarUrl: admins.avatarUrl,
        bio: admins.bio,
      });

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

  // GET /api/admin/analytics — Comprehensive analytics for Super Admin
  getAnalytics: async (query: GetAnalyticsQuery): Promise<AnalyticsResponseData> => {
    const now = dayjs();
    let startDate: Date;
    let endDate: Date = now.toDate();
    let prevStartDate: Date;
    let prevEndDate: Date;

    const range = query.range || "7d";
    if (query.fromDate && query.toDate) {
      startDate = dayjs(query.fromDate).startOf("day").toDate();
      endDate = dayjs(query.toDate).endOf("day").toDate();
      const diffDays = Math.max(1, dayjs(endDate).diff(dayjs(startDate), "day") + 1);
      prevEndDate = dayjs(startDate).subtract(1, "millisecond").toDate();
      prevStartDate = dayjs(prevEndDate).subtract(diffDays, "day").startOf("day").toDate();
    } else if (range === "7d") {
      startDate = now.subtract(7, "day").startOf("day").toDate();
      prevEndDate = dayjs(startDate).subtract(1, "millisecond").toDate();
      prevStartDate = now.subtract(14, "day").startOf("day").toDate();
    } else if (range === "30d") {
      startDate = now.subtract(30, "day").startOf("day").toDate();
      prevEndDate = dayjs(startDate).subtract(1, "millisecond").toDate();
      prevStartDate = now.subtract(60, "day").startOf("day").toDate();
    } else if (range === "90d") {
      startDate = now.subtract(90, "day").startOf("day").toDate();
      prevEndDate = dayjs(startDate).subtract(1, "millisecond").toDate();
      prevStartDate = now.subtract(180, "day").startOf("day").toDate();
    } else if (range === "this_month") {
      startDate = now.startOf("month").toDate();
      prevStartDate = now.subtract(1, "month").startOf("month").toDate();
      prevEndDate = now.subtract(1, "month").endOf("month").toDate();
    } else {
      // "all"
      startDate = dayjs("2020-01-01").toDate();
      prevStartDate = dayjs("2020-01-01").toDate();
      prevEndDate = dayjs("2020-01-01").toDate();
    }

    const timeFilter = and(gte(bookings.startTime, startDate), lte(bookings.startTime, endDate));
    const prevTimeFilter = and(gte(bookings.startTime, prevStartDate), lte(bookings.startTime, prevEndDate));

    // Parallel query execution
    const [
      activeReviewersRes,
      currBookingsRes,
      prevBookingsRes,
      currNoShowRes,
      currCompletedRes,
      prevNoShowRes,
      prevCompletedRes,
      feedbackRowsRes,
      prevFeedbackRowsRes,
      allReviewersRes,
      allBookingsWithReviewerRes,
      allBookingsWithEventRes,
    ] = await Promise.all([
      // Active reviewers
      db.select({ count: count() }).from(reviewers).where(eq(reviewers.isActive, true)),

      // Period bookings
      db.select({ count: count() }).from(bookings).where(timeFilter),
      db.select({ count: count() }).from(bookings).where(prevTimeFilter),

      // No-show & completed in current period
      db.select({ count: count() }).from(bookings).where(and(timeFilter, eq(bookings.status, "no_show"))),
      db.select({ count: count() }).from(bookings).where(and(timeFilter, eq(bookings.status, "completed"))),

      // No-show & completed in previous period
      db.select({ count: count() }).from(bookings).where(and(prevTimeFilter, eq(bookings.status, "no_show"))),
      db.select({ count: count() }).from(bookings).where(and(prevTimeFilter, eq(bookings.status, "completed"))),

      // Turnaround calculation in current period
      db
        .select({
          bookingEndTime: bookings.endTime,
          feedbackCreatedAt: feedback.createdAt,
        })
        .from(feedback)
        .innerJoin(bookings, eq(feedback.bookingId, bookings.id))
        .where(timeFilter),

      // Turnaround in previous period
      db
        .select({
          bookingEndTime: bookings.endTime,
          feedbackCreatedAt: feedback.createdAt,
        })
        .from(feedback)
        .innerJoin(bookings, eq(feedback.bookingId, bookings.id))
        .where(prevTimeFilter),

      // All reviewers list
      db
        .select({
          id: reviewers.id,
          name: reviewers.name,
          email: reviewers.email,
        })
        .from(reviewers)
        .orderBy(desc(reviewers.createdAt)),

      // Bookings grouped by reviewer & status
      db
        .select({
          reviewerId: bookings.reviewerId,
          status: bookings.status,
        })
        .from(bookings)
        .where(range === "all" ? undefined : timeFilter),

      // Bookings with weekStage and eventType name for topic aggregation
      db
        .select({
          weekStage: bookings.weekStage,
          eventTypeName: eventTypes.name,
        })
        .from(bookings)
        .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id)),
    ]);

    const activeReviewers = activeReviewersRes[0]?.count ?? 0;
    const weeklyBookings = currBookingsRes[0]?.count ?? 0;
    const prevWeeklyBookings = prevBookingsRes[0]?.count ?? 0;

    const bookingsChangePct =
      prevWeeklyBookings === 0
        ? null
        : Math.round(((weeklyBookings - prevWeeklyBookings) / prevWeeklyBookings) * 100);

    const currNoShows = currNoShowRes[0]?.count ?? 0;
    const currCompleted = currCompletedRes[0]?.count ?? 0;
    const currTotalDone = currNoShows + currCompleted;

    const overallNoShowRatePct =
      currTotalDone === 0 ? 0 : Math.round((currNoShows / currTotalDone) * 1000) / 10;

    const prevNoShows = prevNoShowRes[0]?.count ?? 0;
    const prevCompleted = prevCompletedRes[0]?.count ?? 0;
    const prevTotalDone = prevNoShows + prevCompleted;

    const prevNoShowRatePct =
      prevTotalDone === 0 ? null : Math.round((prevNoShows / prevTotalDone) * 1000) / 10;

    const noShowRateDeltaPct =
      prevNoShowRatePct !== null
        ? Math.round((overallNoShowRatePct - prevNoShowRatePct) * 10) / 10
        : null;

    // Feedback turnaround hours
    const calculateTurnaround = (rows: { bookingEndTime: Date; feedbackCreatedAt: Date | null }[]) => {
      const valid = rows.filter((r) => r.feedbackCreatedAt && r.bookingEndTime);
      if (valid.length === 0) return 0;
      const totalHours = valid.reduce((acc, r) => {
        const diff = (new Date(r.feedbackCreatedAt!).getTime() - new Date(r.bookingEndTime).getTime()) / (1000 * 3600);
        return acc + Math.max(0, diff);
      }, 0);
      return Math.round((totalHours / valid.length) * 10) / 10;
    };

    const avgFeedbackTurnaroundHours = calculateTurnaround(feedbackRowsRes);
    const prevTurnaround = calculateTurnaround(prevFeedbackRowsRes);
    const turnaroundDeltaHours =
      prevTurnaround > 0 ? Math.round((avgFeedbackTurnaroundHours - prevTurnaround) * 10) / 10 : null;

    // Reviewer aggregation
    const reviewerMap = new Map<
      number,
      { total: number; completed: number; noShow: number }
    >();

    allReviewersRes.forEach((r) => {
      reviewerMap.set(r.id, { total: 0, completed: 0, noShow: 0 });
    });

    allBookingsWithReviewerRes.forEach((b) => {
      const current = reviewerMap.get(b.reviewerId) || { total: 0, completed: 0, noShow: 0 };
      current.total += 1;
      if (b.status === "completed") current.completed += 1;
      if (b.status === "no_show") current.noShow += 1;
      reviewerMap.set(b.reviewerId, current);
    });

    const maxBookings = Math.max(
      ...Array.from(reviewerMap.values()).map((v) => v.total),
      1
    );

    const bookingsPerReviewer: ReviewerBookingStat[] = allReviewersRes
      .map((r) => {
        const stats = reviewerMap.get(r.id) || { total: 0, completed: 0, noShow: 0 };
        return {
          reviewerId: r.id,
          reviewerName: r.name,
          email: r.email,
          bookingCount: stats.total,
          completedCount: stats.completed,
          noShowCount: stats.noShow,
          percentageOfMax: Math.round((stats.total / maxBookings) * 100),
        };
      })
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 10);

    const noShowRatePerReviewer: ReviewerNoShowStat[] = allReviewersRes
      .map((r) => {
        const stats = reviewerMap.get(r.id) || { total: 0, completed: 0, noShow: 0 };
        const evaluated = stats.completed + stats.noShow;
        const noShowRatePct =
          evaluated === 0 ? 0 : Math.round((stats.noShow / evaluated) * 1000) / 10;
        return {
          reviewerId: r.id,
          reviewerName: r.name,
          email: r.email,
          noShowRatePct,
          noShowCount: stats.noShow,
          completedCount: stats.completed,
          totalSessions: evaluated,
        };
      })
      .sort((a, b) => b.noShowRatePct - a.noShowRatePct || b.totalSessions - a.totalSessions)
      .slice(0, 10);

    // Topic / Tech Stack breakdown
    let reactCount = 0;
    let pythonCount = 0;
    let nodeCount = 0;
    let otherCount = 0;

    allBookingsWithEventRes.forEach((item) => {
      const text = `${item.weekStage} ${item.eventTypeName}`.toLowerCase();
      if (text.includes("react") || text.includes("next") || text.includes("frontend") || text.includes("redux")) {
        reactCount += 1;
      } else if (text.includes("python") || text.includes("django") || text.includes("flask") || text.includes("fastapi") || text.includes("ai") || text.includes("ml")) {
        pythonCount += 1;
      } else if (text.includes("node") || text.includes("express") || text.includes("nest") || text.includes("backend")) {
        nodeCount += 1;
      } else {
        otherCount += 1;
      }
    });

    const totalCategorized = reactCount + pythonCount + nodeCount + otherCount;

    let popularTechStacks: TechStackStat[];
    if (totalCategorized === 0) {
      // Benchmark default distribution matching Stitch design if brand new database
      popularTechStacks = [
        { name: "React", count: 0, percentage: 35, color: "#1d4ed8" },
        { name: "Python", count: 0, percentage: 25, color: "#0284c7" },
        { name: "Node.js", count: 0, percentage: 20, color: "#0d9488" },
        { name: "Other", count: 0, percentage: 20, color: "#64748b" },
      ];
    } else {
      popularTechStacks = [
        {
          name: "React",
          count: reactCount,
          percentage: Math.round((reactCount / totalCategorized) * 100),
          color: "#1d4ed8",
        },
        {
          name: "Python",
          count: pythonCount,
          percentage: Math.round((pythonCount / totalCategorized) * 100),
          color: "#0284c7",
        },
        {
          name: "Node.js",
          count: nodeCount,
          percentage: Math.round((nodeCount / totalCategorized) * 100),
          color: "#0d9488",
        },
        {
          name: "Other",
          count: otherCount,
          percentage: Math.max(
            0,
            100 -
              Math.round((reactCount / totalCategorized) * 100) -
              Math.round((pythonCount / totalCategorized) * 100) -
              Math.round((nodeCount / totalCategorized) * 100)
          ),
          color: "#64748b",
        },
      ];
    }

    return {
      timeframe: {
        range,
        startDate: dayjs(startDate).format("YYYY-MM-DD"),
        endDate: dayjs(endDate).format("YYYY-MM-DD"),
        prevStartDate: dayjs(prevStartDate).format("YYYY-MM-DD"),
        prevEndDate: dayjs(prevEndDate).format("YYYY-MM-DD"),
      },
      kpis: {
        weeklyBookings,
        bookingsChangePct,
        overallNoShowRatePct,
        noShowRateDeltaPct,
        avgFeedbackTurnaroundHours,
        turnaroundDeltaHours,
        totalCompletedReviews: currCompleted,
        activeReviewers,
      },
      bookingsPerReviewer,
      noShowRatePerReviewer,
      popularTechStacks,
    };
  },

  // Export raw data formatted as CSV
  exportAnalyticsCsvData: async (query: GetAnalyticsQuery): Promise<string> => {
    const analytics = await adminService.getAnalytics(query);
    const allBookings = await db
      .select({
        id: bookings.id,
        internName: bookings.internName,
        batch: bookings.batch,
        weekStage: bookings.weekStage,
        advisorEmail: bookings.advisorEmail,
        reviewerName: reviewers.name,
        eventTypeName: eventTypes.name,
        status: bookings.status,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
      })
      .from(bookings)
      .innerJoin(reviewers, eq(bookings.reviewerId, reviewers.id))
      .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
      .orderBy(desc(bookings.startTime))
      .limit(1000);

    const lines: string[] = [];

    // Header Metadata
    lines.push("REVSLOT PLATFORM ANALYTICS REPORT");
    lines.push(`Generated At,${dayjs().format("YYYY-MM-DD HH:mm:ss")}`);
    lines.push(`Timeframe,${analytics.timeframe.range} (${analytics.timeframe.startDate} to ${analytics.timeframe.endDate})`);
    lines.push("");

    // KPIs Section
    lines.push("--- KEY PERFORMANCE INDICATORS ---");
    lines.push("Metric,Value,Change vs Previous Period");
    lines.push(`Period Bookings,${analytics.kpis.weeklyBookings},${analytics.kpis.bookingsChangePct !== null ? `${analytics.kpis.bookingsChangePct}%` : "N/A"}`);
    lines.push(`Overall No-Show Rate,${analytics.kpis.overallNoShowRatePct}%,${analytics.kpis.noShowRateDeltaPct !== null ? `${analytics.kpis.noShowRateDeltaPct}%` : "N/A"}`);
    lines.push(`Avg. Feedback Turnaround,${analytics.kpis.avgFeedbackTurnaroundHours} hrs,${analytics.kpis.turnaroundDeltaHours !== null ? `${analytics.kpis.turnaroundDeltaHours} hrs` : "N/A"}`);
    lines.push(`Active Reviewers,${analytics.kpis.activeReviewers},N/A`);
    lines.push(`Total Completed Reviews,${analytics.kpis.totalCompletedReviews},N/A`);
    lines.push("");

    // Reviewer Performance
    lines.push("--- REVIEWER PERFORMANCE BREAKDOWN ---");
    lines.push("Reviewer Name,Email,Total Bookings,Completed Sessions,No-Shows,No-Show Rate (%)");
    analytics.bookingsPerReviewer.forEach((r) => {
      const noShowStat = analytics.noShowRatePerReviewer.find((ns) => ns.reviewerId === r.reviewerId);
      const rate = noShowStat ? `${noShowStat.noShowRatePct}%` : "0.0%";
      lines.push(`"${r.reviewerName}","${r.email}",${r.bookingCount},${r.completedCount},${r.noShowCount},${rate}`);
    });
    lines.push("");

    // Tech Stack Distribution
    lines.push("--- TOPIC & TECH STACK BREAKDOWN ---");
    lines.push("Topic/Stack,Share Percentage,Count");
    analytics.popularTechStacks.forEach((s) => {
      lines.push(`"${s.name}",${s.percentage}%,${s.count}`);
    });
    lines.push("");

    // Raw Bookings
    lines.push("--- RECENT BOOKING RECORDS ---");
    lines.push("Booking ID,Intern Name,Batch,Week/Stage,Reviewer,Event Type,Status,Start Time,End Time");
    allBookings.forEach((b) => {
      const start = b.startTime ? dayjs(b.startTime).format("YYYY-MM-DD HH:mm") : "";
      const end = b.endTime ? dayjs(b.endTime).format("YYYY-MM-DD HH:mm") : "";
      lines.push(`${b.id},"${b.internName}","${b.batch}","${b.weekStage}","${b.reviewerName}","${b.eventTypeName}",${b.status},${start},${end}`);
    });

    return "\uFEFF" + lines.join("\n"); // prepend UTF-8 BOM
  },

  // GET /api/admin/feedback — List feedback submissions across all reviewers with filters
  listFeedbackHistory: async (query: ListAdminFeedbackQuery) => {
    const { search, reviewerId, fromDate, toDate, page, limit } = query;

    const conditions = [];
    if (reviewerId) {
      conditions.push(eq(feedback.reviewerId, reviewerId));
    }
    if (fromDate) {
      conditions.push(gte(feedback.createdAt, dayjs(fromDate).startOf("day").toDate()));
    }
    if (toDate) {
      conditions.push(lte(feedback.createdAt, dayjs(toDate).endOf("day").toDate()));
    }
    if (search) {
      const term = `%${search}%`;
      conditions.push(
        or(
          ilike(bookings.internName, term),
          ilike(bookings.advisorName, term),
          ilike(bookings.advisorEmail, term),
          ilike(reviewers.name, term)
        )
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, totalResult] = await Promise.all([
      db
        .select({
          id: feedback.id,
          bookingId: feedback.bookingId,
          reviewerId: feedback.reviewerId,
          reviewerName: reviewers.name,
          reviewerEmail: reviewers.email,
          reviewerBio: reviewers.bio,
          internName: bookings.internName,
          advisorName: bookings.advisorName,
          advisorEmail: bookings.advisorEmail,
          batch: bookings.batch,
          weekStage: bookings.weekStage,
          formId: feedback.formId,
          formName: feedbackForms.name,
          eventTypeName: eventTypes.name,
          isNoShow: feedback.isNoShow,
          reviewMark: feedback.reviewMark,
          taskMark: feedback.taskMark,
          understandingLevel: feedback.understandingLevel,
          comments: feedback.comments,
          customFieldValues: feedback.customFieldValues,
          createdAt: feedback.createdAt,
          sessionStartTime: bookings.startTime,
          sessionEndTime: bookings.endTime,
        })
        .from(feedback)
        .innerJoin(reviewers, eq(feedback.reviewerId, reviewers.id))
        .innerJoin(bookings, eq(feedback.bookingId, bookings.id))
        .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
        .leftJoin(feedbackForms, eq(feedback.formId, feedbackForms.id))
        .where(where)
        .orderBy(desc(feedback.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ total: count() })
        .from(feedback)
        .innerJoin(reviewers, eq(feedback.reviewerId, reviewers.id))
        .innerJoin(bookings, eq(feedback.bookingId, bookings.id))
        .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
        .leftJoin(feedbackForms, eq(feedback.formId, feedbackForms.id))
        .where(where),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return {
      submissions: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  // GET /api/admin/feedback/:id — Full feedback details for drawer/modal
  getFeedbackDetails: async (feedbackId: number) => {
    const [row] = await db
      .select({
        id: feedback.id,
        bookingId: feedback.bookingId,
        reviewerId: feedback.reviewerId,
        reviewerName: reviewers.name,
        reviewerEmail: reviewers.email,
        reviewerBio: reviewers.bio,
        internName: bookings.internName,
        advisorName: bookings.advisorName,
        advisorEmail: bookings.advisorEmail,
        batch: bookings.batch,
        weekStage: bookings.weekStage,
        formId: feedback.formId,
        formName: feedbackForms.name,
        taskMarkEnabled: feedbackForms.taskMarkEnabled,
        eventTypeName: eventTypes.name,
        isNoShow: feedback.isNoShow,
        reviewMark: feedback.reviewMark,
        taskMark: feedback.taskMark,
        understandingLevel: feedback.understandingLevel,
        comments: feedback.comments,
        customFieldValues: feedback.customFieldValues,
        createdAt: feedback.createdAt,
        updatedAt: feedback.updatedAt,
        sessionStartTime: bookings.startTime,
        sessionEndTime: bookings.endTime,
      })
      .from(feedback)
      .innerJoin(reviewers, eq(feedback.reviewerId, reviewers.id))
      .innerJoin(bookings, eq(feedback.bookingId, bookings.id))
      .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
      .leftJoin(feedbackForms, eq(feedback.formId, feedbackForms.id))
      .where(eq(feedback.id, feedbackId));

    if (!row) {
      throw new AppError("Feedback record not found", 404);
    }

    const customFields = Object.entries(row.customFieldValues ?? {}).map(([fieldId, entry]) => ({
      id: Number(fieldId),
      label: entry.label,
      fieldType: entry.fieldType,
      value: entry.value,
      options: entry.options ?? null,
    }));

    const pendingQuestions = await db
      .select({
        id: feedbackPendingQuestions.id,
        questionId: questions.id,
        questionText: questions.questionText,
        description: questions.description,
        status: feedbackPendingQuestions.status,
        assignedAt: feedbackPendingQuestions.assignedAt,
        completedAt: feedbackPendingQuestions.completedAt,
      })
      .from(feedbackPendingQuestions)
      .innerJoin(questions, eq(feedbackPendingQuestions.questionId, questions.id))
      .where(eq(feedbackPendingQuestions.feedbackId, row.id))
      .orderBy(asc(feedbackPendingQuestions.id));

    return {
      ...row,
      customFields,
      pendingQuestions,
    };
  },
};