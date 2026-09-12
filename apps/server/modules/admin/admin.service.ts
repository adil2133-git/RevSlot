import dayjs from "dayjs";
import bcrypt from "bcryptjs";
import { eq, and, or, ilike, sql, gte, lte, desc, count } from "drizzle-orm";
import { db } from "../../config/db.js";
import { reviewers } from "../auth/reviewers.schema.js";
import { bookings } from "../booking/bookings.schema.js";
import { eventTypes } from "../eventType/eventTypes.schema.js";
import { feedback, feedbackForms } from "../feedback/feedback.schema.js";
import { admins } from "./admins.schema.js";
import { auditLogService } from "../auditLog/auditLog.service.js";
import { AppError } from "../../core/errors/AppError.js";
import type {
  ListReviewersQuery,
  UpdateReviewerStatusInput,
  ListBookingsQuery,
  UpdateAdminProfileInput,
  ListFeedbackHistoryQuery,
} from "./admin.validation.js";

export const adminService = {
  // GET /api/admin/feedback — Feedback History
  listFeedbackHistory: async (query: Partial<ListFeedbackHistoryQuery> = {}) => {
    const { search, reviewerId, fromDate, toDate, page = 1, limit = 20 } = query;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(reviewers.name, `%${search}%`),
          ilike(bookings.internName, `%${search}%`),
          ilike(bookings.advisorName, `%${search}%`),
          ilike(feedbackForms.name, `%${search}%`)
        )
      );
    }

    if (reviewerId) {
      conditions.push(eq(feedback.reviewerId, reviewerId));
    }

    if (fromDate) {
      conditions.push(gte(feedback.createdAt, dayjs(fromDate).startOf("day").toDate()));
    }

    if (toDate) {
      conditions.push(lte(feedback.createdAt, dayjs(toDate).endOf("day").toDate()));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, totalResult] = await Promise.all([
      db
        .select({
          id: feedback.id,
          bookingId: feedback.bookingId,
          reviewerId: feedback.reviewerId,
          reviewerName: reviewers.name,
          reviewerDepartment: reviewers.professionalHeadline,
          internName: bookings.internName,
          advisorName: bookings.advisorName,
          formId: feedback.formId,
          formName: feedbackForms.name,
          isNoShow: feedback.isNoShow,
          reviewMark: feedback.reviewMark,
          taskMark: feedback.taskMark,
          comments: feedback.comments,
          understandingLevel: feedback.understandingLevel,
          customFieldValues: feedback.customFieldValues,
          submittedAt: feedback.createdAt,
        })
        .from(feedback)
        .leftJoin(bookings, eq(feedback.bookingId, bookings.id))
        .leftJoin(reviewers, eq(feedback.reviewerId, reviewers.id))
        .leftJoin(feedbackForms, eq(feedback.formId, feedbackForms.id))
        .where(where)
        .orderBy(desc(feedback.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ total: count() })
        .from(feedback)
        .leftJoin(bookings, eq(feedback.bookingId, bookings.id))
        .leftJoin(reviewers, eq(feedback.reviewerId, reviewers.id))
        .leftJoin(feedbackForms, eq(feedback.formId, feedbackForms.id))
        .where(where),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return {
      feedback: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },
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
  // (with % vs last week), No-Show Rate.
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
    const [thisWeekRes, lastWeekRes, totalBookingsRes] = await Promise.all([
      db
        .select({ count: count() })
        .from(bookings)
        .where(and(gte(bookings.startTime, thisWeekStart), lte(bookings.startTime, thisWeekEnd))),
      db
        .select({ count: count() })
        .from(bookings)
        .where(and(gte(bookings.startTime, lastWeekStart), lte(bookings.startTime, lastWeekEnd))),
      db.select({ count: count() }).from(bookings),
    ]);

    const weeklyCurrent = thisWeekRes[0]?.count ?? 0;
    const weeklyPrevious = lastWeekRes[0]?.count ?? 0;
    const totalBookingsCount = totalBookingsRes[0]?.count ?? 0;

    const weeklyChangePct =
      weeklyPrevious > 0
        ? Number((((weeklyCurrent - weeklyPrevious) / weeklyPrevious) * 100).toFixed(1))
        : (weeklyCurrent > 0 ? 100 : 0);

    // 2. KPI 2: Overall No-Show Rate
    const [thisPeriodCompletedNoShow, thisPeriodNoShows, lastPeriodCompletedNoShow, lastPeriodNoShows] =
      await Promise.all([
        db
          .select({ count: count() })
          .from(bookings)
          .where(sql`${bookings.status} IN ('completed', 'no_show')`),
        db.select({ count: count() }).from(bookings).where(eq(bookings.status, "no_show")),
        db
          .select({ count: count() })
          .from(bookings)
          .where(
            and(
              gte(bookings.startTime, lastWeekStart),
              lte(bookings.startTime, lastWeekEnd),
              sql`${bookings.status} IN ('completed', 'no_show')`
            )
          ),
        db
          .select({ count: count() })
          .from(bookings)
          .where(
            and(
              gte(bookings.startTime, lastWeekStart),
              lte(bookings.startTime, lastWeekEnd),
              eq(bookings.status, "no_show")
            )
          ),
      ]);

    const totalPastBookings = thisPeriodCompletedNoShow[0]?.count ?? 0;
    const totalNoShowsCount = thisPeriodNoShows[0]?.count ?? 0;
    const currentNoShowRate =
      totalPastBookings > 0
        ? Number(((totalNoShowsCount / totalPastBookings) * 100).toFixed(1))
        : 0;

    const lastTotalPast = lastPeriodCompletedNoShow[0]?.count ?? 0;
    const lastNoShows = lastPeriodNoShows[0]?.count ?? 0;
    const previousNoShowRate =
      lastTotalPast > 0
        ? Number(((lastNoShows / lastTotalPast) * 100).toFixed(1))
        : 0;

    const noShowChangePct = Number((currentNoShowRate - previousNoShowRate).toFixed(1));

    // 3. KPI 3: Avg. Feedback Turnaround (Hours)
    const feedbackRecords = await db
      .select({
        feedbackCreated: feedback.createdAt,
        bookingEnd: bookings.endTime,
        bookingStart: bookings.startTime,
      })
      .from(feedback)
      .innerJoin(bookings, eq(feedback.bookingId, bookings.id))
      .where(eq(feedback.isNoShow, false));

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
    const activeReviewers = await db
      .select({ id: reviewers.id, name: reviewers.name })
      .from(reviewers)
      .where(eq(reviewers.isActive, true));

    const reviewerStats = await Promise.all(
      activeReviewers.map(async (rev) => {
        const [totalBRes, completedOrNoShowRes, noShowRes] = await Promise.all([
          db.select({ count: count() }).from(bookings).where(eq(bookings.reviewerId, rev.id)),
          db
            .select({ count: count() })
            .from(bookings)
            .where(
              and(eq(bookings.reviewerId, rev.id), sql`${bookings.status} IN ('completed', 'no_show')`)
            ),
          db
            .select({ count: count() })
            .from(bookings)
            .where(and(eq(bookings.reviewerId, rev.id), eq(bookings.status, "no_show"))),
        ]);

        const totalBookings = totalBRes[0]?.count ?? 0;
        const pastBookings = completedOrNoShowRes[0]?.count ?? 0;
        const noShowCount = noShowRes[0]?.count ?? 0;

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
    const bookingTopics = await db
      .select({
        id: bookings.id,
        formData: bookings.formData,
        eventTypeName: eventTypes.name,
      })
      .from(bookings)
      .leftJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id));

    const stackCounts: Record<"React" | "Python" | "Node.js" | "Other", number> = {
      React: 0,
      Python: 0,
      "Node.js": 0,
      Other: 0,
    };

    for (const b of bookingTopics) {
      const topicStr = (
        (b.formData?.topic as string) ||
        (b.formData?.techStack as string) ||
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

  // PATCH /api/admin/me
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
};