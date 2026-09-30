import { eq, and, ne, gte, lt, sql, asc } from "drizzle-orm";
import { db } from "../../config/db.js";
import { bookings } from "../booking/bookings.schema.js";
import { slots } from "../slot/slots.schema.js";
import { eventTypes } from "../eventType/eventTypes.schema.js";
import { reviewers } from "../auth/reviewers.schema.js";
import { feedback, feedbackPendingQuestions, feedbackForms } from "../feedback/feedback.schema.js";
import { questions } from "../questionBank/questions.schema.js";
import { payments } from "../payment/payments.schema.js";
import { walletTransactions } from "../wallet/wallet.schema.js";
import { bookingDisputes } from "../dispute/disputes.schema.js";

type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export const findAdvisorBookingsRepo = async (
  cleanEmail: string,
  options: { scope?: "upcoming" | "past" | "cancelled" | undefined; search?: string | undefined },
  tx: DbOrTx = db
) => {
  const { scope = "upcoming", search } = options;
  const now = new Date();

  const baseConditions = [eq(bookings.advisorEmail, cleanEmail)];

  if (search && search.trim() !== "") {
    const pattern = `%${search.trim().toLowerCase()}%`;
    baseConditions.push(
      sql`(
        LOWER(${bookings.internName}) LIKE ${pattern} OR
        LOWER(${bookings.batch}) LIKE ${pattern} OR
        LOWER(${bookings.weekStage}) LIKE ${pattern} OR
        LOWER(${reviewers.name}) LIKE ${pattern} OR
        LOWER(${eventTypes.name}) LIKE ${pattern}
      )`
    );
  }

  const scopeConditions = [...baseConditions];

  if (scope === "upcoming") {
    scopeConditions.push(gte(bookings.endTime, now));
    scopeConditions.push(ne(bookings.status, "cancelled"));
  } else if (scope === "past") {
    scopeConditions.push(lt(bookings.endTime, now));
    scopeConditions.push(ne(bookings.status, "cancelled"));
  } else if (scope === "cancelled") {
    scopeConditions.push(eq(bookings.status, "cancelled"));
  }

  const orderBy = scope === "upcoming"
    ? sql`${bookings.startTime} ASC`
    : sql`${bookings.startTime} DESC`;

  return tx
    .select({
      id: bookings.id,
      slotId: bookings.id,
      eventTypeId: bookings.eventTypeId,
      internName: bookings.internName,
      batch: bookings.batch,
      advisorName: bookings.advisorName,
      advisorEmail: bookings.advisorEmail,
      weekStage: bookings.weekStage,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      status: bookings.status,
      meetLink: bookings.meetLink,
      cancelledAt: bookings.cancelledAt,
      cancelledReason: bookings.cancelledReason,
      proposedStartTime: bookings.proposedStartTime,
      proposedEndTime: bookings.proposedEndTime,
      rescheduleReason: bookings.rescheduleReason,
      rescheduleToken: bookings.rescheduleToken,
      rescheduleRequestedBy: bookings.rescheduleRequestedBy,
      rescheduleCount: bookings.rescheduleCount,
      eventTypeName: eventTypes.name,
      bookingWindowDays: eventTypes.bookingWindowDays,
      price: eventTypes.price,
      paymentStatus: payments.status,
      paymentAmount: payments.amount,
      refundAmount: payments.refundAmount,
      cancellationFee: payments.cancellationFee,
      razorpayPaymentId: payments.razorpayPaymentId,
      reviewerName: reviewers.name,
      timezone: sql<string>`'IST'`,
      hasFeedback: sql<boolean>`${feedback.id} is not null`,
      disputeId: bookingDisputes.id,
      disputeReason: bookingDisputes.reason,
      disputeDescription: bookingDisputes.description,
      disputeStatus: bookingDisputes.status,
      disputeAdminNotes: bookingDisputes.adminNotes,
      disputeCreatedAt: bookingDisputes.createdAt,
      disputeResolvedAt: bookingDisputes.resolvedAt,
    })
    .from(bookings)
    .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
    .innerJoin(reviewers, eq(bookings.reviewerId, reviewers.id))
    .leftJoin(payments, eq(payments.bookingId, bookings.id))
    .leftJoin(feedback, eq(feedback.bookingId, bookings.id))
    .leftJoin(bookingDisputes, eq(bookingDisputes.bookingId, bookings.id))
    .where(and(...scopeConditions))
    .orderBy(orderBy);
};

export const countAdvisorBookingsByScopeRepo = async (
  cleanEmail: string,
  tx: DbOrTx = db
) => {
  const now = new Date();

  const [upcomingCountRes, pastCountRes, cancelledCountRes] = await Promise.all([
    tx
      .select({ count: sql<number>`count(*)::int` })
      .from(bookings)
      .where(and(eq(bookings.advisorEmail, cleanEmail), gte(bookings.endTime, now), ne(bookings.status, "cancelled"))),
    tx
      .select({ count: sql<number>`count(*)::int` })
      .from(bookings)
      .where(and(eq(bookings.advisorEmail, cleanEmail), lt(bookings.endTime, now), ne(bookings.status, "cancelled"))),
    tx
      .select({ count: sql<number>`count(*)::int` })
      .from(bookings)
      .where(and(eq(bookings.advisorEmail, cleanEmail), eq(bookings.status, "cancelled"))),
  ]);

  return {
    upcoming: upcomingCountRes[0]?.count ?? 0,
    past: pastCountRes[0]?.count ?? 0,
    cancelled: cancelledCountRes[0]?.count ?? 0,
  };
};

export const findAdvisorBookingFeedbackHeaderRepo = async (
  cleanEmail: string,
  bookingId: number,
  tx: DbOrTx = db
) => {
  const [booking] = await tx
    .select({
      id: bookings.id,
      advisorEmail: bookings.advisorEmail,
      internName: bookings.internName,
      batch: bookings.batch,
      weekStage: bookings.weekStage,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      reviewerName: reviewers.name,
      eventTypeName: eventTypes.name,
    })
    .from(bookings)
    .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
    .innerJoin(reviewers, eq(bookings.reviewerId, reviewers.id))
    .where(and(eq(bookings.id, bookingId), eq(bookings.advisorEmail, cleanEmail)))
    .limit(1);

  return booking ?? null;
};

export const findFeedbackByBookingIdRepo = async (
  bookingId: number,
  tx: DbOrTx = db
) => {
  const [fb] = await tx
    .select()
    .from(feedback)
    .where(eq(feedback.bookingId, bookingId))
    .limit(1);
  return fb ?? null;
};

export const findFeedbackPendingQuestionsByFeedbackIdRepo = async (
  feedbackId: number,
  tx: DbOrTx = db
) => {
  return tx
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
    .where(eq(feedbackPendingQuestions.feedbackId, feedbackId))
    .orderBy(asc(feedbackPendingQuestions.id));
};

export const findFeedbackFormNameByIdRepo = async (
  formId: number,
  tx: DbOrTx = db
) => {
  const [form] = await tx
    .select({ name: feedbackForms.name })
    .from(feedbackForms)
    .where(eq(feedbackForms.id, formId))
    .limit(1);
  return form?.name ?? null;
};

export const findAdvisorBookingByIdAndEmailRepo = async (
  cleanEmail: string,
  bookingId: number,
  tx: DbOrTx = db
) => {
  const [booking] = await tx
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.advisorEmail, cleanEmail)))
    .limit(1);
  return booking ?? null;
};

export const findEventTypeNameByIdRepo = async (
  eventTypeId: number,
  tx: DbOrTx = db
) => {
  const [eventType] = await tx
    .select({ name: eventTypes.name })
    .from(eventTypes)
    .where(eq(eventTypes.id, eventTypeId))
    .limit(1);
  return eventType ?? null;
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

export const cancelBookingWithReasonRepo = async (
  bookingId: number,
  reasonText: string,
  tx: DbOrTx = db
) => {
  const [result] = await tx
    .update(bookings)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledReason: reasonText,
    })
    .where(eq(bookings.id, bookingId))
    .returning();
  return result ?? null;
};

export const releaseSlotByDateTimeRepo = async (
  eventTypeId: number,
  slotDate: string,
  startTime: string,
  endTime: string,
  tx: DbOrTx = db
) => {
  return tx
    .update(slots)
    .set({ status: "available", holdToken: null, holdExpiresAt: null, updatedAt: new Date() })
    .where(
      and(
        eq(slots.eventTypeId, eventTypeId),
        eq(slots.slotDate, slotDate),
        eq(slots.startTime, startTime),
        eq(slots.endTime, endTime)
      )
    );
};

export const rescheduleBookingRepo = async (
  bookingId: number,
  newStartTime: Date,
  newEndTime: Date,
  rescheduleCount: number,
  tx: DbOrTx = db
) => {
  const [updated] = await tx
    .update(bookings)
    .set({
      startTime: newStartTime,
      endTime: newEndTime,
      status: "rescheduled",
      rescheduleCount,
      meetLink: null,
      googleEventId: null,
    })
    .where(eq(bookings.id, bookingId))
    .returning();
  return updated ?? null;
};

export const bookSlotByIdRepo = async (
  slotId: number,
  tx: DbOrTx = db
) => {
  return tx
    .update(slots)
    .set({ status: "booked", holdToken: null, holdExpiresAt: null, updatedAt: new Date() })
    .where(eq(slots.id, slotId));
};

export const updateEscrowAvailableAtRepo = async (
  bookingId: number,
  availableAt: Date,
  tx: DbOrTx = db
) => {
  return tx
    .update(walletTransactions)
    .set({ availableAt })
    .where(and(eq(walletTransactions.bookingId, bookingId), eq(walletTransactions.type, "credit_escrow")));
};

export const advisorRepository = {
  findAdvisorBookings: findAdvisorBookingsRepo,
  countAdvisorBookingsByScope: countAdvisorBookingsByScopeRepo,
  findAdvisorBookingFeedbackHeader: findAdvisorBookingFeedbackHeaderRepo,
  findFeedbackByBookingId: findFeedbackByBookingIdRepo,
  findFeedbackPendingQuestionsByFeedbackId: findFeedbackPendingQuestionsByFeedbackIdRepo,
  findFeedbackFormNameById: findFeedbackFormNameByIdRepo,
  findAdvisorBookingByIdAndEmail: findAdvisorBookingByIdAndEmailRepo,
  findEventTypeNameById: findEventTypeNameByIdRepo,
  findReviewerContactById: findReviewerContactByIdRepo,
  cancelBookingWithReason: cancelBookingWithReasonRepo,
  releaseSlotByDateTime: releaseSlotByDateTimeRepo,
  rescheduleBooking: rescheduleBookingRepo,
  bookSlotById: bookSlotByIdRepo,
  updateEscrowAvailableAt: updateEscrowAvailableAtRepo,
};
