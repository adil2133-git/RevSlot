import dayjs from "dayjs";
import { eq, and, or, ilike, sql, gte, lte, desc, count } from "drizzle-orm";
import { db } from "../../config/db.js";
import { reviewers } from "../auth/reviewers.model.js";
import { bookings } from "../booking/bookings.model.js";
import { eventTypes } from "../eventType/eventTypes.model.js";
import { AppError } from "../../core/errors/AppError.js";
import type {
  ListReviewersQuery,
  UpdateReviewerStatusInput,
  ListBookingsQuery,
} from "./admin.schema.js";

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

    const [rows, [{ total }]] = await Promise.all([
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

    return {
      reviewers: rows,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  },

  // Task 7 — PATCH /api/admin/reviewers/:id
  updateReviewerStatus: async (reviewerId: number, input: UpdateReviewerStatusInput) => {
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

    const [rows, [{ total }]] = await Promise.all([
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
      [{ totalReviewers }],
      [{ activeReviewers }],
      [{ bookingsThisWeek }],
      [{ bookingsLastWeek }],
      [{ totalCompletedOrNoShow }],
      [{ noShowCount }],
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
};