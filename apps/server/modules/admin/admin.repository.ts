import { eq, and, or, ilike, sql, gte, lte, desc, count } from "drizzle-orm";
import dayjs from "dayjs";
import { db } from "../../config/db.js";
import { reviewers } from "../auth/reviewers.schema.js";
import { bookings } from "../booking/bookings.schema.js";
import { eventTypes } from "../eventType/eventTypes.schema.js";
import { feedback, feedbackForms } from "../feedback/feedback.schema.js";
import { admins } from "./admins.schema.js";
import {
  payoutRequests,
  reviewerWallets,
  walletTransactions,
  reviewerPayoutProfiles,
} from "../wallet/wallet.schema.js";
import type {
  ListReviewersQuery,
  ListBookingsQuery,
  ListFeedbackHistoryQuery,
} from "./admin.validation.js";

type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

// ============================================================================
// Payout Requests (admin.payouts.service)
// ============================================================================

export const listPayoutRequestsRepo = async (
  params: {
    status?: "requested" | "completed" | "rejected" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
  },
  tx: DbOrTx = db
) => {
  const page = params.page || 1;
  const limit = params.limit || 5;
  const offset = (page - 1) * limit;

  const baseQuery = tx
    .select({
      id: payoutRequests.id,
      reviewerId: payoutRequests.reviewerId,
      amount: payoutRequests.amount,
      status: payoutRequests.status,
      transactionReference: payoutRequests.transactionReference,
      notes: payoutRequests.notes,
      adminNotes: payoutRequests.adminNotes,
      requestedAt: payoutRequests.requestedAt,
      processedAt: payoutRequests.processedAt,
      processedBy: payoutRequests.processedBy,
      reviewerName: reviewers.name,
      reviewerEmail: reviewers.email,
      reviewerAvatar: reviewers.avatarUrl,
      reviewerDepartment: reviewers.professionalHeadline,
      payoutMethod: reviewerPayoutProfiles.payoutMethod,
      accountHolderName: reviewerPayoutProfiles.accountHolderName,
      accountNumber: reviewerPayoutProfiles.accountNumber,
      ifscCode: reviewerPayoutProfiles.ifscCode,
      upiId: reviewerPayoutProfiles.upiId,
    })
    .from(payoutRequests)
    .innerJoin(reviewers, eq(reviewers.id, payoutRequests.reviewerId))
    .leftJoin(
      reviewerPayoutProfiles,
      eq(reviewerPayoutProfiles.reviewerId, payoutRequests.reviewerId)
    );

  const whereClause = params.status
    ? eq(payoutRequests.status, params.status)
    : undefined;

  const items = await (whereClause ? baseQuery.where(whereClause) : baseQuery)
    .orderBy(desc(payoutRequests.requestedAt))
    .limit(limit)
    .offset(offset);

  const [totalRecord] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(payoutRequests)
    .where(whereClause ? whereClause : sql`true`);

  const [stats] = await tx
    .select({
      pendingCount: sql<number>`count(case when ${payoutRequests.status} = 'requested' then 1 end)::int`,
      pendingAmount: sql<number>`coalesce(sum(case when ${payoutRequests.status} = 'requested' then ${payoutRequests.amount} else 0 end), 0)::int`,
      completedAmount: sql<number>`coalesce(sum(case when ${payoutRequests.status} = 'completed' then ${payoutRequests.amount} else 0 end), 0)::int`,
    })
    .from(payoutRequests);

  return {
    items,
    total: totalRecord?.count || 0,
    page,
    limit,
    stats: {
      pendingCount: stats?.pendingCount || 0,
      pendingAmount: stats?.pendingAmount || 0,
      completedAmount: stats?.completedAmount || 0,
    },
  };
};

export const findPayoutRequestByIdRepo = async (
  payoutId: number,
  tx: DbOrTx = db
) => {
  const [payout] = await tx
    .select()
    .from(payoutRequests)
    .where(eq(payoutRequests.id, payoutId))
    .limit(1);

  return payout ?? null;
};

export const approvePayoutRequestRepo = async (
  payoutId: number,
  adminId: number,
  transactionReference: string,
  adminNotes: string,
  tx: DbOrTx = db
) => {
  const [updated] = await tx
    .update(payoutRequests)
    .set({
      status: "completed",
      transactionReference,
      adminNotes,
      processedAt: new Date(),
      processedBy: adminId,
    })
    .where(eq(payoutRequests.id, payoutId))
    .returning();

  return updated ?? null;
};

export const rejectPayoutRequestRepo = async (
  payoutId: number,
  adminId: number,
  adminNotes: string,
  tx: DbOrTx = db
) => {
  const [updated] = await tx
    .update(payoutRequests)
    .set({
      status: "rejected",
      adminNotes,
      processedAt: new Date(),
      processedBy: adminId,
    })
    .where(eq(payoutRequests.id, payoutId))
    .returning();

  return updated ?? null;
};

export const findRecentReviewerWithdrawalTxRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [recentTx] = await tx
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.reviewerId, reviewerId))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(5);

  return recentTx ?? null;
};

export const updateWalletTransactionStatusAndDescriptionRepo = async (
  id: number,
  status: "pending" | "completed" | "failed" | "disputed",
  description: string,
  tx: DbOrTx = db
) => {
  return tx
    .update(walletTransactions)
    .set({
      status,
      description,
    })
    .where(eq(walletTransactions.id, id));
};

export const findReviewerWalletByReviewerIdRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [wallet] = await tx
    .select()
    .from(reviewerWallets)
    .where(eq(reviewerWallets.reviewerId, reviewerId))
    .limit(1);

  return wallet ?? null;
};

export const refundReviewerWalletBalanceRepo = async (
  walletId: number,
  amount: number,
  currentAvailable: number,
  currentWithdrawn: number,
  tx: DbOrTx = db
) => {
  return tx
    .update(reviewerWallets)
    .set({
      availableBalance: currentAvailable + amount,
      withdrawnBalance: Math.max(0, currentWithdrawn - amount),
      updatedAt: new Date(),
    })
    .where(eq(reviewerWallets.id, walletId));
};

export const insertFailedWithdrawalTxRepo = async (
  reviewerId: number,
  amount: number,
  description: string,
  tx: DbOrTx = db
) => {
  return tx.insert(walletTransactions).values({
    reviewerId,
    type: "withdrawal",
    amount,
    status: "failed",
    description,
  });
};

export const findReviewerContactByIdRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [reviewer] = await tx
    .select({ name: reviewers.name, email: reviewers.email })
    .from(reviewers)
    .where(eq(reviewers.id, reviewerId))
    .limit(1);

  return reviewer ?? null;
};

export const findAdminNameByIdRepo = async (
  adminId: number,
  tx: DbOrTx = db
) => {
  const [actorAdmin] = await tx
    .select({ name: admins.name })
    .from(admins)
    .where(eq(admins.id, adminId))
    .limit(1);

  return actorAdmin ?? null;
};

// ============================================================================
// Feedback History
// ============================================================================

export const listFeedbackHistoryRepo = async (
  query: Partial<ListFeedbackHistoryQuery> = {},
  tx: DbOrTx = db
) => {
  const { search, reviewerId, fromDate, toDate, page = 1, limit = 5 } = query;

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
    tx
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
    tx
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
};

// ============================================================================
// Reviewers & Bookings Management
// ============================================================================

export const listReviewersAdminRepo = async (
  query: ListReviewersQuery,
  tx: DbOrTx = db
) => {
  const { search, status, page = 1, limit = 5 } = query;

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
    tx
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
    tx.select({ total: count() }).from(reviewers).where(where),
  ]);

  const total = totalResult[0]?.total ?? 0;

  return {
    reviewers: rows,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

export const findReviewerByIdAdminRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [existing] = await tx
    .select()
    .from(reviewers)
    .where(eq(reviewers.id, reviewerId))
    .limit(1);

  return existing ?? null;
};

export const updateReviewerStatusAdminRepo = async (
  reviewerId: number,
  isActive: boolean,
  tx: DbOrTx = db
) => {
  const [updated] = await tx
    .update(reviewers)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(reviewers.id, reviewerId))
    .returning({
      id: reviewers.id,
      name: reviewers.name,
      email: reviewers.email,
      isActive: reviewers.isActive,
    });

  return updated ?? null;
};

export const listBookingsAdminRepo = async (
  query: ListBookingsQuery,
  tx: DbOrTx = db
) => {
  const { status, reviewerId, fromDate, toDate, page = 1, limit = 5 } = query;

  const conditions = [];
  if (status) conditions.push(eq(bookings.status, status));
  if (reviewerId) conditions.push(eq(bookings.reviewerId, reviewerId));
  if (fromDate) conditions.push(gte(bookings.startTime, dayjs(fromDate).startOf("day").toDate()));
  if (toDate) conditions.push(lte(bookings.startTime, dayjs(toDate).endOf("day").toDate()));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalResult] = await Promise.all([
    tx
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
    tx.select({ total: count() }).from(bookings).where(where),
  ]);

  const total = totalResult[0]?.total ?? 0;

  return {
    bookings: rows,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

// ============================================================================
// Dashboard & Analytics Stats
// ============================================================================

export const getDashboardStatsAdminRepo = async (
  thisWeekStart: Date,
  thisWeekEnd: Date,
  lastWeekStart: Date,
  lastWeekEnd: Date,
  tx: DbOrTx = db
) => {
  const [
    totalReviewersResult,
    activeReviewersResult,
    bookingsThisWeekResult,
    bookingsLastWeekResult,
    totalCompletedOrNoShowResult,
    noShowCountResult,
  ] = await Promise.all([
    tx.select({ totalReviewers: count() }).from(reviewers),
    tx.select({ activeReviewers: count() }).from(reviewers).where(eq(reviewers.isActive, true)),
    tx
      .select({ bookingsThisWeek: count() })
      .from(bookings)
      .where(and(gte(bookings.startTime, thisWeekStart), lte(bookings.startTime, thisWeekEnd))),
    tx
      .select({ bookingsLastWeek: count() })
      .from(bookings)
      .where(and(gte(bookings.startTime, lastWeekStart), lte(bookings.startTime, lastWeekEnd))),
    tx
      .select({ totalCompletedOrNoShow: count() })
      .from(bookings)
      .where(sql`${bookings.status} IN ('completed', 'no_show')`),
    tx.select({ noShowCount: count() }).from(bookings).where(eq(bookings.status, "no_show")),
  ]);

  return {
    totalReviewers: totalReviewersResult[0]?.totalReviewers ?? 0,
    activeReviewers: activeReviewersResult[0]?.activeReviewers ?? 0,
    bookingsThisWeek: bookingsThisWeekResult[0]?.bookingsThisWeek ?? 0,
    bookingsLastWeek: bookingsLastWeekResult[0]?.bookingsLastWeek ?? 0,
    totalCompletedOrNoShow: totalCompletedOrNoShowResult[0]?.totalCompletedOrNoShow ?? 0,
    noShowCount: noShowCountResult[0]?.noShowCount ?? 0,
  };
};

export const getWeeklyBookingsKpiRepo = async (
  thisWeekStart: Date,
  thisWeekEnd: Date,
  lastWeekStart: Date,
  lastWeekEnd: Date,
  tx: DbOrTx = db
) => {
  const [thisWeekRes, lastWeekRes, totalBookingsRes] = await Promise.all([
    tx
      .select({ count: count() })
      .from(bookings)
      .where(and(gte(bookings.startTime, thisWeekStart), lte(bookings.startTime, thisWeekEnd))),
    tx
      .select({ count: count() })
      .from(bookings)
      .where(and(gte(bookings.startTime, lastWeekStart), lte(bookings.startTime, lastWeekEnd))),
    tx.select({ count: count() }).from(bookings),
  ]);

  return {
    weeklyCurrent: thisWeekRes[0]?.count ?? 0,
    weeklyPrevious: lastWeekRes[0]?.count ?? 0,
    totalBookingsCount: totalBookingsRes[0]?.count ?? 0,
  };
};

export const getNoShowStatsKpiRepo = async (
  lastWeekStart: Date,
  lastWeekEnd: Date,
  tx: DbOrTx = db
) => {
  const [thisPeriodCompletedNoShow, thisPeriodNoShows, lastPeriodCompletedNoShow, lastPeriodNoShows] =
    await Promise.all([
      tx
        .select({ count: count() })
        .from(bookings)
        .where(sql`${bookings.status} IN ('completed', 'no_show')`),
      tx.select({ count: count() }).from(bookings).where(eq(bookings.status, "no_show")),
      tx
        .select({ count: count() })
        .from(bookings)
        .where(
          and(
            gte(bookings.startTime, lastWeekStart),
            lte(bookings.startTime, lastWeekEnd),
            sql`${bookings.status} IN ('completed', 'no_show')`
          )
        ),
      tx
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

  return {
    totalPastBookings: thisPeriodCompletedNoShow[0]?.count ?? 0,
    totalNoShowsCount: thisPeriodNoShows[0]?.count ?? 0,
    lastTotalPast: lastPeriodCompletedNoShow[0]?.count ?? 0,
    lastNoShows: lastPeriodNoShows[0]?.count ?? 0,
  };
};

export const getFeedbackTurnaroundRecordsRepo = async (tx: DbOrTx = db) => {
  return tx
    .select({
      feedbackCreated: feedback.createdAt,
      bookingEnd: bookings.endTime,
      bookingStart: bookings.startTime,
    })
    .from(feedback)
    .innerJoin(bookings, eq(feedback.bookingId, bookings.id))
    .where(eq(feedback.isNoShow, false));
};

export const getActiveReviewersForAnalyticsRepo = async (tx: DbOrTx = db) => {
  return tx
    .select({ id: reviewers.id, name: reviewers.name })
    .from(reviewers)
    .where(eq(reviewers.isActive, true));
};

export const getReviewerBookingStatsForAnalyticsRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [totalBRes, completedOrNoShowRes, noShowRes] = await Promise.all([
    tx.select({ count: count() }).from(bookings).where(eq(bookings.reviewerId, reviewerId)),
    tx
      .select({ count: count() })
      .from(bookings)
      .where(
        and(eq(bookings.reviewerId, reviewerId), sql`${bookings.status} IN ('completed', 'no_show')`)
      ),
    tx
      .select({ count: count() })
      .from(bookings)
      .where(and(eq(bookings.reviewerId, reviewerId), eq(bookings.status, "no_show"))),
  ]);

  return {
    totalBookings: totalBRes[0]?.count ?? 0,
    pastBookings: completedOrNoShowRes[0]?.count ?? 0,
    noShowCount: noShowRes[0]?.count ?? 0,
  };
};

export const getBookingTopicsForAnalyticsRepo = async (tx: DbOrTx = db) => {
  return tx
    .select({
      id: bookings.id,
      formData: bookings.formData,
      eventTypeName: eventTypes.name,
    })
    .from(bookings)
    .leftJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id));
};

export const findAdminProfileByIdRepo = async (
  adminId: number,
  tx: DbOrTx = db
) => {
  const [admin] = await tx
    .select({
      id: admins.id,
      name: admins.name,
      email: admins.email,
      avatarUrl: admins.avatarUrl,
      bio: admins.bio,
      createdAt: admins.createdAt,
    })
    .from(admins)
    .where(eq(admins.id, adminId))
    .limit(1);

  return admin ?? null;
};

export const findAdminFullByIdRepo = async (
  adminId: number,
  tx: DbOrTx = db
) => {
  const [admin] = await tx
    .select()
    .from(admins)
    .where(eq(admins.id, adminId))
    .limit(1);

  return admin ?? null;
};

export const updateAdminProfileRepo = async (
  adminId: number,
  updates: Partial<typeof admins.$inferInsert>,
  tx: DbOrTx = db
) => {
  const [updated] = await tx
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

  return updated ?? null;
};

export const adminRepository = {
  listPayoutRequests: listPayoutRequestsRepo,
  findPayoutRequestById: findPayoutRequestByIdRepo,
  approvePayoutRequest: approvePayoutRequestRepo,
  rejectPayoutRequest: rejectPayoutRequestRepo,
  findRecentReviewerWithdrawalTx: findRecentReviewerWithdrawalTxRepo,
  updateWalletTransactionStatusAndDescription: updateWalletTransactionStatusAndDescriptionRepo,
  findReviewerWalletByReviewerId: findReviewerWalletByReviewerIdRepo,
  refundReviewerWalletBalance: refundReviewerWalletBalanceRepo,
  insertFailedWithdrawalTx: insertFailedWithdrawalTxRepo,
  findReviewerContactById: findReviewerContactByIdRepo,
  findAdminNameById: findAdminNameByIdRepo,
  listFeedbackHistory: listFeedbackHistoryRepo,
  listReviewersAdmin: listReviewersAdminRepo,
  findReviewerByIdAdmin: findReviewerByIdAdminRepo,
  updateReviewerStatusAdmin: updateReviewerStatusAdminRepo,
  listBookingsAdmin: listBookingsAdminRepo,
  getDashboardStatsAdmin: getDashboardStatsAdminRepo,
  getWeeklyBookingsKpi: getWeeklyBookingsKpiRepo,
  getNoShowStatsKpi: getNoShowStatsKpiRepo,
  getFeedbackTurnaroundRecords: getFeedbackTurnaroundRecordsRepo,
  getActiveReviewersForAnalytics: getActiveReviewersForAnalyticsRepo,
  getReviewerBookingStatsForAnalytics: getReviewerBookingStatsForAnalyticsRepo,
  getBookingTopicsForAnalytics: getBookingTopicsForAnalyticsRepo,
  findAdminProfileById: findAdminProfileByIdRepo,
  findAdminFullById: findAdminFullByIdRepo,
  updateAdminProfile: updateAdminProfileRepo,
};
