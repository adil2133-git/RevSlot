import { eq, and, desc, sql } from "drizzle-orm";
import dayjs from "dayjs";
import { db } from "../../config/db.js";
import { bookingDisputes } from "./disputes.schema.js";
import { bookings } from "../booking/bookings.schema.js";
import { eventTypes } from "../eventType/eventTypes.schema.js";
import { reviewers } from "../auth/reviewers.schema.js";
import { payments } from "../payment/payments.schema.js";
import { walletTransactions, reviewerWallets } from "../wallet/wallet.schema.js";
import { meetingService } from "../meeting/meeting.service.js";
import { refundService } from "../payment/refund.service.js";
import { AppError } from "../../core/errors/AppError.js";

export interface ReportDisputeInput {
  reason: "reviewer_no_show" | "technical_issue" | "inadequate_review" | "other";
  description: string;
}

export const disputeService = {
  reportDispute: async (
    bookingId: number,
    advisorEmail: string,
    data: ReportDisputeInput
  ) => {
    const [booking] = await db
      .select({
        id: bookings.id,
        advisorEmail: bookings.advisorEmail,
        reviewerId: bookings.reviewerId,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
      })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    if (booking.advisorEmail.toLowerCase() !== advisorEmail.toLowerCase()) {
      throw new AppError("You are not authorized to report an issue for this session", 403);
    }

    // Must have started
    if (dayjs().isBefore(dayjs(booking.startTime))) {
      throw new AppError("You can only report an issue after the session scheduled start time", 400);
    }

    // Must be within 48 hours of session end
    const hoursSinceEnd = dayjs().diff(dayjs(booking.endTime), "hour", true);
    if (hoursSinceEnd > 48) {
      throw new AppError("Disputes must be submitted within 48 hours of the session completion", 400);
    }

    // Check existing
    const [existing] = await db
      .select()
      .from(bookingDisputes)
      .where(eq(bookingDisputes.bookingId, bookingId))
      .limit(1);

    if (existing) {
      throw new AppError("A dispute is already registered for this booking", 409);
    }

    // Attendance verification signals from meeting room
    const attendance = meetingService.getAttendance(bookingId);

    const [dispute] = await db
      .insert(bookingDisputes)
      .values({
        bookingId,
        advisorEmail,
        reason: data.reason,
        description: data.description,
        status: "under_review",
        meetingJoinedByReviewer: attendance.reviewerJoined,
        meetingJoinedByClient: attendance.clientJoined,
      })
      .returning();

    // FREEZE ESCROW: Mark escrow transaction as 'disputed' so it cannot auto-mature
    await db
      .update(walletTransactions)
      .set({ status: "disputed" })
      .where(
        and(
          eq(walletTransactions.bookingId, bookingId),
          eq(walletTransactions.type, "credit_escrow")
        )
      );

    return dispute;
  },

  getDisputeForBooking: async (bookingId: number, advisorEmail: string) => {
    const [dispute] = await db
      .select()
      .from(bookingDisputes)
      .where(
        and(
          eq(bookingDisputes.bookingId, bookingId),
          eq(bookingDisputes.advisorEmail, advisorEmail)
        )
      )
      .limit(1);

    return dispute || null;
  },

  listAdminDisputes: async (params: {
    status?: "under_review" | "resolved_refunded" | "resolved_dismissed";
    page?: number;
    limit?: number;
  }) => {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const baseQuery = db
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

    const items = await (whereClause ? baseQuery.where(whereClause) : baseQuery)
      .orderBy(desc(bookingDisputes.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalRecord] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookingDisputes)
      .where(whereClause ? whereClause : sql`true`);

    return {
      items,
      total: totalRecord?.count || 0,
      page,
      limit,
    };
  },

  adminResolveDispute: async (
    disputeId: number,
    adminId: number,
    data: {
      action: "refund_client" | "dismiss";
      adminNotes?: string;
    }
  ) => {
    const [dispute] = await db
      .select()
      .from(bookingDisputes)
      .where(eq(bookingDisputes.id, disputeId))
      .limit(1);

    if (!dispute) {
      throw new AppError("Dispute not found", 404);
    }

    if (dispute.status !== "under_review") {
      throw new AppError("This dispute has already been resolved", 400);
    }

    if (data.action === "refund_client") {
      // 100% full refund to client via Razorpay
      await refundService.processBookingRefund({
        bookingId: dispute.bookingId,
        initiatedBy: "system",
        reason: `Dispute approved: ${dispute.description}`,
      });

      const [updated] = await db
        .update(bookingDisputes)
        .set({
          status: "resolved_refunded",
          adminNotes: data.adminNotes || "Approved 100% refund for reviewer no-show/issue",
          resolvedAt: new Date(),
          resolvedBy: adminId,
        })
        .where(eq(bookingDisputes.id, disputeId))
        .returning();

      return updated;
    } else {
      // Dismiss false/fraudulent dispute: unfreeze escrow so funds mature normally
      await db
        .update(walletTransactions)
        .set({ status: "completed" })
        .where(
          and(
            eq(walletTransactions.bookingId, dispute.bookingId),
            eq(walletTransactions.type, "credit_escrow")
          )
        );

      const [updated] = await db
        .update(bookingDisputes)
        .set({
          status: "resolved_dismissed",
          adminNotes: data.adminNotes || "Dispute dismissed; meeting attendance verified.",
          resolvedAt: new Date(),
          resolvedBy: adminId,
        })
        .where(eq(bookingDisputes.id, disputeId))
        .returning();

      return updated;
    }
  },
};
