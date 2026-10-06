import { eq, and, desc, sql, type InferInsertModel } from "drizzle-orm";
import { db } from "../../config/db.js";
import { bookingDisputes } from "./disputes.schema.js";
import { bookings } from "../booking/bookings.schema.js";
import { eventTypes } from "../eventType/eventTypes.schema.js";
import { reviewers } from "../auth/reviewers.schema.js";
import { payments } from "../payment/payments.schema.js";
import { walletTransactions } from "../wallet/wallet.schema.js";
import { admins } from "../admin/admins.schema.js";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | Transaction;

export type NewBookingDispute = InferInsertModel<typeof bookingDisputes>;

export const findBookingWithReviewerAndEventForDisputeRepo = async (
  bookingId: number,
  tx: DbOrTx = db
) => {
  const [booking] = await tx
    .select({
      id: bookings.id,
      advisorName: bookings.advisorName,
      advisorEmail: bookings.advisorEmail,
      reviewerId: bookings.reviewerId,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      status: bookings.status,
      reviewerName: reviewers.name,
      reviewerEmail: reviewers.email,
      eventTypeName: eventTypes.name,
    })
    .from(bookings)
    .innerJoin(reviewers, eq(bookings.reviewerId, reviewers.id))
    .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  return booking;
};

export const findDisputeByBookingIdRepo = async (
  bookingId: number,
  tx: DbOrTx = db
) => {
  const [existing] = await tx
    .select()
    .from(bookingDisputes)
    .where(eq(bookingDisputes.bookingId, bookingId))
    .limit(1);

  return existing;
};

export const insertDisputeRepo = async (
  values: {
    bookingId: number;
    advisorEmail: string;
    reason: "reviewer_no_show" | "technical_issue" | "inadequate_review" | "other";
    description: string;
    status: "under_review" | "resolved_refunded" | "resolved_dismissed";
    meetingJoinedByReviewer: boolean;
    meetingJoinedByClient: boolean;
  },
  tx: DbOrTx = db
) => {
  const [dispute] = await tx
    .insert(bookingDisputes)
    .values(values)
    .returning();

  return dispute;
};

export const updateEscrowTransactionStatusRepo = async (
  bookingId: number,
  status: "disputed" | "completed",
  tx: DbOrTx = db
) => {
  return await tx
    .update(walletTransactions)
    .set({ status })
    .where(
      and(
        eq(walletTransactions.bookingId, bookingId),
        eq(walletTransactions.type, "credit_escrow")
      )
    );
};

export const findActiveAdminsForDisputeAlertRepo = async (
  tx: DbOrTx = db
) => {
  return await tx
    .select({ email: admins.email, name: admins.name })
    .from(admins)
    .where(eq(admins.isActive, true));
};

export const findDisputeByBookingAndAdvisorEmailRepo = async (
  bookingId: number,
  advisorEmail: string,
  tx: DbOrTx = db
) => {
  const [dispute] = await tx
    .select()
    .from(bookingDisputes)
    .where(
      and(
        eq(bookingDisputes.bookingId, bookingId),
        eq(bookingDisputes.advisorEmail, advisorEmail.trim().toLowerCase())
      )
    )
    .limit(1);

  return dispute || null;
};

export const findDisputeByBookingAndReviewerIdRepo = async (
  bookingId: number,
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [dispute] = await tx
    .select({
      id: bookingDisputes.id,
      bookingId: bookingDisputes.bookingId,
      advisorEmail: bookingDisputes.advisorEmail,
      reason: bookingDisputes.reason,
      description: bookingDisputes.description,
      status: bookingDisputes.status,
      meetingJoinedByReviewer: bookingDisputes.meetingJoinedByReviewer,
      meetingJoinedByClient: bookingDisputes.meetingJoinedByClient,
      adminNotes: bookingDisputes.adminNotes,
      resolvedAt: bookingDisputes.resolvedAt,
      resolvedBy: bookingDisputes.resolvedBy,
      createdAt: bookingDisputes.createdAt,
    })
    .from(bookingDisputes)
    .innerJoin(bookings, eq(bookings.id, bookingDisputes.bookingId))
    .where(
      and(
        eq(bookingDisputes.bookingId, bookingId),
        eq(bookings.reviewerId, reviewerId)
      )
    )
    .limit(1);

  return dispute || null;
};

export const listAdminDisputesWithTotalRepo = async (
  params: {
    status?: "under_review" | "resolved_refunded" | "resolved_dismissed" | undefined;
    page: number;
    limit: number;
    offset: number;
  },
  tx: DbOrTx = db
) => {
  const baseQuery = tx
    .select({
      id: bookingDisputes.id,
      bookingId: bookingDisputes.bookingId,
      advisorEmail: bookingDisputes.advisorEmail,
      reason: bookingDisputes.reason,
      description: bookingDisputes.description,
      status: bookingDisputes.status,
      meetingJoinedByReviewer: bookingDisputes.meetingJoinedByReviewer,
      meetingJoinedByClient: bookingDisputes.meetingJoinedByClient,
      adminNotes: bookingDisputes.adminNotes,
      resolvedAt: bookingDisputes.resolvedAt,
      resolvedBy: bookingDisputes.resolvedBy,
      createdAt: bookingDisputes.createdAt,
      // Booking & Reviewer details
      internName: bookings.internName,
      advisorName: bookings.advisorName,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      reviewerId: bookings.reviewerId,
      reviewerName: reviewers.name,
      reviewerEmail: reviewers.email,
      eventTypeName: eventTypes.name,
      // Payment info
      paymentAmount: payments.amount,
      paymentStatus: payments.status,
      razorpayPaymentId: payments.razorpayPaymentId,
    })
    .from(bookingDisputes)
    .innerJoin(bookings, eq(bookings.id, bookingDisputes.bookingId))
    .innerJoin(reviewers, eq(reviewers.id, bookings.reviewerId))
    .innerJoin(eventTypes, eq(eventTypes.id, bookings.eventTypeId))
    .leftJoin(payments, eq(payments.bookingId, bookings.id));

  const whereClause = params.status
    ? eq(bookingDisputes.status, params.status)
    : undefined;

  const [items, totalRecord] = await Promise.all([
    (whereClause ? baseQuery.where(whereClause) : baseQuery)
      .orderBy(desc(bookingDisputes.createdAt))
      .limit(params.limit)
      .offset(params.offset),
    tx
      .select({ count: sql<number>`count(*)::int` })
      .from(bookingDisputes)
      .where(whereClause ? whereClause : sql`true`),
  ]);

  return {
    items,
    total: totalRecord[0]?.count || 0,
  };
};

export const findDisputeByIdRepo = async (
  disputeId: number,
  tx: DbOrTx = db
) => {
  const [dispute] = await tx
    .select()
    .from(bookingDisputes)
    .where(eq(bookingDisputes.id, disputeId))
    .limit(1);

  return dispute;
};

export const findBookingDataForDisputeResolutionRepo = async (
  bookingId: number,
  tx: DbOrTx = db
) => {
  const [bookingData] = await tx
    .select({
      id: bookings.id,
      advisorName: bookings.advisorName,
      advisorEmail: bookings.advisorEmail,
      reviewerId: bookings.reviewerId,
      reviewerName: reviewers.name,
      reviewerEmail: reviewers.email,
      eventTypeName: eventTypes.name,
    })
    .from(bookings)
    .innerJoin(reviewers, eq(bookings.reviewerId, reviewers.id))
    .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  return bookingData;
};

export const updateDisputeStatusRepo = async (
  disputeId: number,
  data: {
    status: "resolved_refunded" | "resolved_dismissed";
    adminNotes: string;
    resolvedAt: Date;
    resolvedBy: number;
  },
  tx: DbOrTx = db
) => {
  const [updated] = await tx
    .update(bookingDisputes)
    .set(data)
    .where(eq(bookingDisputes.id, disputeId))
    .returning();

  return updated;
};

export const findAdminNameByIdRepo = async (
  adminId: number,
  tx: DbOrTx = db
) => {
  const [actorAdmin] = await tx
    .select({ name: admins.name })
    .from(admins)
    .where(eq(admins.id, adminId));

  return actorAdmin;
};

export const disputeRepository = {
  findBookingWithReviewerAndEventForDispute: findBookingWithReviewerAndEventForDisputeRepo,
  findDisputeByBookingId: findDisputeByBookingIdRepo,
  insertDispute: insertDisputeRepo,
  updateEscrowTransactionStatus: updateEscrowTransactionStatusRepo,
  findActiveAdminsForDisputeAlert: findActiveAdminsForDisputeAlertRepo,
  findDisputeByBookingAndAdvisorEmail: findDisputeByBookingAndAdvisorEmailRepo,
  findDisputeByBookingAndReviewerId: findDisputeByBookingAndReviewerIdRepo,
  listAdminDisputesWithTotal: listAdminDisputesWithTotalRepo,
  findDisputeById: findDisputeByIdRepo,
  findBookingDataForDisputeResolution: findBookingDataForDisputeResolutionRepo,
  updateDisputeStatus: updateDisputeStatusRepo,
  findAdminNameById: findAdminNameByIdRepo,
};
