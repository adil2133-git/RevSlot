import { eq, and, ne, inArray, gte, lte, lt, gt, isNull, sql } from "drizzle-orm";
import { db } from "../../config/db.js";
import { slots } from "../slot/slots.schema.js";
import { bookings } from "./bookings.schema.js";
import { eventTypes } from "../eventType/eventTypes.schema.js";
import { reviewers } from "../auth/reviewers.schema.js";
import { feedback } from "../feedback/feedback.schema.js";
import { payments } from "../payment/payments.schema.js";
import { reviewerWallets, walletTransactions } from "../wallet/wallet.schema.js";
import { bookingDisputes } from "../dispute/disputes.schema.js";
import { availabilityTemplates } from "../availability/schema/availabilityTemplates.schema.js";
import type { GetMyBookingsOptions } from "./booking.service.js";

type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

// ============================================================================
// Timezone & Ownership Queries
// ============================================================================

export const getEventTimezoneRepo = async (
  eventTypeId: number,
  tx: DbOrTx = db
): Promise<string> => {
  const [templateRow] = await tx
    .select({ timezone: availabilityTemplates.timezone })
    .from(eventTypes)
    .innerJoin(
      availabilityTemplates,
      eq(eventTypes.availabilityTemplateId, availabilityTemplates.id)
    )
    .where(eq(eventTypes.id, eventTypeId))
    .limit(1);

  return templateRow?.timezone || "Asia/Kolkata";
};

export const getOwnedBookingOrThrowRepo = async (
  reviewerId: number,
  bookingId: number,
  tx: DbOrTx = db
) => {
  const [booking] = await tx
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.reviewerId, reviewerId)))
    .limit(1);

  return booking ?? null;
};

export const releaseBookingSlotRepo = async (
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
        eq(slots.endTime, endTime),
        eq(slots.status, "booked")
      )
    );
};

export const checkCrossEventConflictRepo = async (
  reviewerId: number,
  slotDate: string,
  startTime: string,
  endTime: string,
  excludeSlotId: number,
  targetStart: Date,
  targetEnd: Date,
  tx: DbOrTx = db
) => {
  const conflicts = await tx
    .select()
    .from(slots)
    .where(
      and(
        eq(slots.reviewerId, reviewerId),
        eq(slots.slotDate, slotDate),
        ne(slots.id, excludeSlotId),
        sql`(${slots.status} = 'booked' OR (${slots.status} = 'held' AND ${slots.holdExpiresAt} > now()))`,
        sql`(${slots.startTime}, ${slots.endTime}) OVERLAPS (${startTime}::time, ${endTime}::time)`
      )
    );

  if (conflicts.length > 0) return true;

  const bookingConflicts = await tx
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.reviewerId, reviewerId),
        sql`${bookings.status} IN ('confirmed', 'rescheduled')`,
        sql`(${bookings.startTime}, ${bookings.endTime}) OVERLAPS (${targetStart}::timestamptz, ${targetEnd}::timestamptz)`
      )
    )
    .limit(1);

  return bookingConflicts.length > 0;
};

// ============================================================================
// Booking Creation Queries
// ============================================================================

export const findHeldSlotByTokenRepo = async (
  holdToken: string,
  tx: DbOrTx = db
) => {
  const [slot] = await tx
    .select()
    .from(slots)
    .where(
      and(
        eq(slots.holdToken, holdToken),
        eq(slots.status, "held"),
        sql`${slots.holdExpiresAt} > now()`
      )
    )
    .limit(1);

  return slot ?? null;
};

export const findEventTypePriceByIdRepo = async (
  eventTypeId: number,
  tx: DbOrTx = db
) => {
  const [row] = await tx
    .select({ price: eventTypes.price })
    .from(eventTypes)
    .where(eq(eventTypes.id, eventTypeId))
    .limit(1);

  return row ?? null;
};

export const findPaymentByOrderIdRepo = async (
  razorpayOrderId: string,
  tx: DbOrTx = db
) => {
  const [paymentRecord] = await tx
    .select()
    .from(payments)
    .where(eq(payments.razorpayOrderId, razorpayOrderId))
    .limit(1);

  return paymentRecord ?? null;
};

export const findExistingPaymentByPaymentIdExcludingRepo = async (
  razorpayPaymentId: string,
  excludePaymentId: number,
  tx: DbOrTx = db
) => {
  const [existingPayment] = await tx
    .select({ id: payments.id })
    .from(payments)
    .where(
      and(
        eq(payments.razorpayPaymentId, razorpayPaymentId),
        ne(payments.id, excludePaymentId)
      )
    )
    .limit(1);

  return existingPayment ?? null;
};

export const insertBookingRepo = async (
  values: typeof bookings.$inferInsert,
  tx: DbOrTx = db
) => {
  const [booking] = await tx
    .insert(bookings)
    .values(values)
    .returning();

  return booking ?? null;
};

export const linkPaymentToBookingRepo = async (
  paymentId: number,
  bookingId: number,
  razorpayPaymentId: string,
  advisorEmail: string,
  tx: DbOrTx = db
) => {
  return tx
    .update(payments)
    .set({
      bookingId,
      razorpayPaymentId,
      advisorEmail,
      status: "captured",
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentId));
};

export const findReviewerWalletRepo = async (
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

export const creditReviewerWalletEscrowRepo = async (
  walletId: number,
  amount: number,
  currentPending: number,
  tx: DbOrTx = db
) => {
  return tx
    .update(reviewerWallets)
    .set({
      pendingBalance: currentPending + amount,
      updatedAt: new Date(),
    })
    .where(eq(reviewerWallets.id, walletId));
};

export const createReviewerWalletRepo = async (
  reviewerId: number,
  pendingBalance: number,
  tx: DbOrTx = db
) => {
  return tx.insert(reviewerWallets).values({
    reviewerId,
    pendingBalance,
    availableBalance: 0,
    withdrawnBalance: 0,
  });
};

export const insertWalletEscrowTransactionRepo = async (
  values: typeof walletTransactions.$inferInsert,
  tx: DbOrTx = db
) => {
  return tx.insert(walletTransactions).values(values);
};

export const markSlotBookedRepo = async (
  slotId: number,
  tx: DbOrTx = db
) => {
  return tx
    .update(slots)
    .set({ status: "booked", updatedAt: new Date() })
    .where(eq(slots.id, slotId));
};

// ============================================================================
// Finalize & Reviewer Info Queries
// ============================================================================

export const findBookingFinalizeDetailsRepo = async (
  eventTypeId: number,
  reviewerId: number,
  bookingId: number,
  tx: DbOrTx = db
) => {
  const [eventType] = await tx
    .select({
      name: eventTypes.name,
      price: eventTypes.price,
    })
    .from(eventTypes)
    .where(eq(eventTypes.id, eventTypeId))
    .limit(1);

  const [reviewer] = await tx
    .select({ name: reviewers.name, email: reviewers.email })
    .from(reviewers)
    .where(eq(reviewers.id, reviewerId))
    .limit(1);

  const [bookingPayment] = await tx
    .select({
      razorpayPaymentId: payments.razorpayPaymentId,
    })
    .from(payments)
    .where(eq(payments.bookingId, bookingId))
    .limit(1);

  return {
    eventType: eventType ?? null,
    reviewer: reviewer ?? null,
    bookingPayment: bookingPayment ?? null,
  };
};

export const updateBookingMeetingDetailsRepo = async (
  bookingId: number,
  meetLink: string,
  googleEventId?: string | null | undefined,
  tx: DbOrTx = db
) => {
  const setValues: Partial<typeof bookings.$inferInsert> = { meetLink };
  if (googleEventId !== undefined) {
    setValues.googleEventId = googleEventId;
  }
  return tx
    .update(bookings)
    .set(setValues)
    .where(eq(bookings.id, bookingId));
};

// ============================================================================
// Bookings Listing & Details
// ============================================================================

export const findMyBookingsRepo = async (
  reviewerId: number,
  options: GetMyBookingsOptions,
  tx: DbOrTx = db
) => {
  const { page, limit, status, scope, search, sortBy, sortOrder } = options;
  const offset = (page - 1) * limit;
  const now = new Date();

  const conditions = [eq(bookings.reviewerId, reviewerId)];

  if (status && status.length > 0) {
    conditions.push(inArray(bookings.status, status));
  }

  if (scope === "upcoming") {
    conditions.push(gte(bookings.startTime, now));
    conditions.push(ne(bookings.status, "cancelled"));
  } else if (scope === "past") {
    conditions.push(lt(bookings.startTime, now));
  } else if (scope === "ongoing") {
    conditions.push(lte(bookings.startTime, now));
    conditions.push(gte(bookings.endTime, now));
    conditions.push(ne(bookings.status, "cancelled"));
  }

  if (search && search.trim() !== "") {
    const pattern = `%${search.trim().toLowerCase()}%`;
    conditions.push(
      sql`(
        LOWER(${bookings.internName}) LIKE ${pattern} OR
        LOWER(${bookings.batch}) LIKE ${pattern} OR
        LOWER(${bookings.weekStage}) LIKE ${pattern} OR
        LOWER(${bookings.advisorName}) LIKE ${pattern} OR
        LOWER(${eventTypes.name}) LIKE ${pattern}
      )`
    );
  }

  const orderBy =
    scope === "upcoming" || scope === "ongoing"
      ? sql`${bookings.startTime} ASC`
      : sortBy === "createdAt"
      ? (sortOrder === "asc" ? sql`${bookings.createdAt} ASC` : sql`${bookings.createdAt} DESC`)
      : (sortOrder === "asc" ? sql`${bookings.startTime} ASC` : sql`${bookings.startTime} DESC`);

  const reviewerCondition = eq(bookings.reviewerId, reviewerId);

  const [rows, countResult, countsRes] = await Promise.all([
    tx
      .select({
        id: bookings.id,
        eventTypeId: bookings.eventTypeId,
        internName: bookings.internName,
        batch: bookings.batch,
        advisorName: bookings.advisorName,
        advisorEmail: bookings.advisorEmail,
        weekStage: bookings.weekStage,
        formData: bookings.formData,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
        meetLink: bookings.meetLink,
        cancelledAt: bookings.cancelledAt,
        cancelledReason: bookings.cancelledReason,
        proposedStartTime: bookings.proposedStartTime,
        proposedEndTime: bookings.proposedEndTime,
        rescheduleRequestedBy: bookings.rescheduleRequestedBy,
        rescheduleReason: bookings.rescheduleReason,
        rescheduleToken: bookings.rescheduleToken,
        eventTypeName: eventTypes.name,
        bookingWindowDays: eventTypes.bookingWindowDays,
        price: eventTypes.price,
        paymentStatus: payments.status,
        paymentAmount: payments.amount,
        refundAmount: payments.refundAmount,
        cancellationFee: payments.cancellationFee,
        razorpayPaymentId: payments.razorpayPaymentId,
        rescheduleCount: bookings.rescheduleCount,
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
      .leftJoin(payments, eq(payments.bookingId, bookings.id))
      .leftJoin(feedback, eq(feedback.bookingId, bookings.id))
      .leftJoin(bookingDisputes, eq(bookingDisputes.bookingId, bookings.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    tx
      .select({ count: sql<number>`count(*)::int` })
      .from(bookings)
      .where(and(...conditions)),
    tx
      .select({
        all: sql<number>`count(*)::int`,
        ongoing: sql<number>`count(case when ${bookings.startTime} <= ${now} and ${bookings.endTime} >= ${now} and ${bookings.status} != 'cancelled' then 1 end)::int`,
        upcoming: sql<number>`count(case when ${bookings.startTime} >= ${now} and ${bookings.status} != 'cancelled' then 1 end)::int`,
        reschedule_requested: sql<number>`count(case when ${bookings.status} = 'reschedule_requested' then 1 end)::int`,
        completed: sql<number>`count(case when ${bookings.status} = 'completed' then 1 end)::int`,
        rescheduled: sql<number>`count(case when ${bookings.status} = 'rescheduled' then 1 end)::int`,
        cancelled: sql<number>`count(case when ${bookings.status} = 'cancelled' then 1 end)::int`,
        no_show: sql<number>`count(case when ${bookings.status} = 'no_show' then 1 end)::int`,
      })
      .from(bookings)
      .where(reviewerCondition),
  ]);

  const totalCount = countResult[0]?.count ?? 0;
  const defaultCounts = { all: 0, ongoing: 0, upcoming: 0, reschedule_requested: 0, completed: 0, rescheduled: 0, cancelled: 0, no_show: 0 };

  return {
    rows,
    totalCount,
    counts: countsRes[0] ?? defaultCounts,
  };
};

export const findBookingDetailsByIdRepo = async (
  reviewerId: number,
  bookingId: number,
  tx: DbOrTx = db
) => {
  const [row] = await tx
    .select({
      id: bookings.id,
      eventTypeId: bookings.eventTypeId,
      internName: bookings.internName,
      batch: bookings.batch,
      advisorName: bookings.advisorName,
      advisorEmail: bookings.advisorEmail,
      internEmails: bookings.internEmails,
      weekStage: bookings.weekStage,
      formData: bookings.formData,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      status: bookings.status,
      meetLink: bookings.meetLink,
      cancelledAt: bookings.cancelledAt,
      cancelledReason: bookings.cancelledReason,
      rescheduledFromBookingId: bookings.rescheduledFromBookingId,
      proposedStartTime: bookings.proposedStartTime,
      proposedEndTime: bookings.proposedEndTime,
      rescheduleRequestedBy: bookings.rescheduleRequestedBy,
      rescheduleReason: bookings.rescheduleReason,
      rescheduleToken: bookings.rescheduleToken,
      eventTypeName: eventTypes.name,
      bookingWindowDays: eventTypes.bookingWindowDays,
      price: eventTypes.price,
      paymentStatus: payments.status,
      paymentAmount: payments.amount,
      refundAmount: payments.refundAmount,
      cancellationFee: payments.cancellationFee,
      razorpayPaymentId: payments.razorpayPaymentId,
      rescheduleCount: bookings.rescheduleCount,
      hasFeedback: sql<boolean>`${feedback.id} is not null`,
    })
    .from(bookings)
    .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
    .leftJoin(payments, eq(payments.bookingId, bookings.id))
    .leftJoin(feedback, eq(feedback.bookingId, bookings.id))
    .where(and(eq(bookings.id, bookingId), eq(bookings.reviewerId, reviewerId)))
    .limit(1);

  return row ?? null;
};

// ============================================================================
// Cancellation, Reschedule & Outcome
// ============================================================================

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

export const cancelBookingInDbRepo = async (
  bookingId: number,
  reason: string,
  tx: DbOrTx = db
) => {
  const [result] = await tx
    .update(bookings)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledReason: reason,
    })
    .where(eq(bookings.id, bookingId))
    .returning();

  return result ?? null;
};

export const updateBookingRescheduledRepo = async (
  bookingId: number,
  newStartTime: Date,
  newEndTime: Date,
  tx: DbOrTx = db
) => {
  const [updated] = await tx
    .update(bookings)
    .set({
      startTime: newStartTime,
      endTime: newEndTime,
      status: "rescheduled",
      meetLink: null,
      googleEventId: null,
    })
    .where(eq(bookings.id, bookingId))
    .returning();

  return updated ?? null;
};

export const bookSlotWithResetHoldRepo = async (
  slotId: number,
  tx: DbOrTx = db
) => {
  return tx
    .update(slots)
    .set({ status: "booked", holdToken: null, holdExpiresAt: null, updatedAt: new Date() })
    .where(eq(slots.id, slotId));
};

export const updateEscrowAvailableAtForBookingRepo = async (
  bookingId: number,
  availableAt: Date,
  tx: DbOrTx = db
) => {
  return tx
    .update(walletTransactions)
    .set({ availableAt })
    .where(and(eq(walletTransactions.bookingId, bookingId), eq(walletTransactions.type, "credit_escrow")));
};

export const updateBookingRescheduleRequestedRepo = async (
  bookingId: number,
  proposedStartTime: Date,
  proposedEndTime: Date,
  rescheduleReason: string | null,
  rescheduleToken: string,
  rescheduleTokenExpiresAt: Date,
  tx: DbOrTx = db
) => {
  const [updated] = await tx
    .update(bookings)
    .set({
      status: "reschedule_requested",
      proposedStartTime,
      proposedEndTime,
      rescheduleRequestedBy: "reviewer",
      rescheduleReason,
      rescheduleToken,
      rescheduleTokenExpiresAt,
    })
    .where(eq(bookings.id, bookingId))
    .returning();

  return updated ?? null;
};

export const findRescheduleRequestByTokenRepo = async (
  token: string,
  tx: DbOrTx = db
) => {
  const [booking] = await tx
    .select()
    .from(bookings)
    .where(and(eq(bookings.rescheduleToken, token), eq(bookings.status, "reschedule_requested")))
    .limit(1);

  return booking ?? null;
};

export const findRescheduleReviewerRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [reviewer] = await tx
    .select({ id: reviewers.id, name: reviewers.name, email: reviewers.email })
    .from(reviewers)
    .where(eq(reviewers.id, reviewerId))
    .limit(1);

  return reviewer ?? null;
};

export const findRescheduleEventTypeRepo = async (
  eventTypeId: number,
  tx: DbOrTx = db
) => {
  const [eventType] = await tx
    .select({
      id: eventTypes.id,
      name: eventTypes.name,
      durationMinutes: eventTypes.durationMinutes,
      slug: eventTypes.slug,
      price: eventTypes.price,
    })
    .from(eventTypes)
    .where(eq(eventTypes.id, eventTypeId))
    .limit(1);

  return eventType ?? null;
};

export const findPaymentByBookingIdRepo = async (
  bookingId: number,
  tx: DbOrTx = db
) => {
  const [payment] = await tx
    .select({
      amount: payments.amount,
      status: payments.status,
      razorpayPaymentId: payments.razorpayPaymentId,
    })
    .from(payments)
    .where(eq(payments.bookingId, bookingId))
    .limit(1);

  return payment ?? null;
};

export const acceptRescheduleRequestRepo = async (
  bookingId: number,
  newStartTime: Date,
  newEndTime: Date,
  tx: DbOrTx = db
) => {
  const [updated] = await tx
    .update(bookings)
    .set({
      startTime: newStartTime,
      endTime: newEndTime,
      status: "confirmed",
      proposedStartTime: null,
      proposedEndTime: null,
      rescheduleRequestedBy: null,
      rescheduleReason: null,
      rescheduleToken: null,
      rescheduleTokenExpiresAt: null,
      meetLink: null,
      googleEventId: null,
    })
    .where(eq(bookings.id, bookingId))
    .returning();

  return updated ?? null;
};

export const declineRescheduleRequestRepo = async (
  bookingId: number,
  reason: string,
  tx: DbOrTx = db
) => {
  const [updated] = await tx
    .update(bookings)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledReason: reason,
      proposedStartTime: null,
      proposedEndTime: null,
      rescheduleRequestedBy: null,
      rescheduleReason: null,
      rescheduleToken: null,
      rescheduleTokenExpiresAt: null,
    })
    .where(eq(bookings.id, bookingId))
    .returning();

  return updated ?? null;
};

export const findFeedbackByBookingIdExistsRepo = async (
  bookingId: number,
  tx: DbOrTx = db
) => {
  const [existingFeedback] = await tx
    .select({ id: feedback.id })
    .from(feedback)
    .where(eq(feedback.bookingId, bookingId))
    .limit(1);

  return existingFeedback ?? null;
};

export const updateBookingOutcomeRepo = async (
  bookingId: number,
  currentStatus: NonNullable<typeof bookings.$inferSelect["status"]>,
  outcome: "completed" | "no_show",
  tx: DbOrTx = db
) => {
  const [updated] = await tx
    .update(bookings)
    .set({ status: outcome })
    .where(and(eq(bookings.id, bookingId), eq(bookings.status, currentStatus)))
    .returning();

  return updated ?? null;
};

// ============================================================================
// Booking Reminders (bookingReminder.service)
// ============================================================================

export const findUpcomingBookingsNeedingRemindersRepo = async (
  now: Date,
  inOneHour: Date,
  tx: DbOrTx = db
) => {
  return tx
    .select({
      id: bookings.id,
      reviewerId: bookings.reviewerId,
      eventTypeId: bookings.eventTypeId,
      internName: bookings.internName,
      advisorName: bookings.advisorName,
      advisorEmail: bookings.advisorEmail,
      internEmails: bookings.internEmails,
      formData: bookings.formData,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      meetLink: bookings.meetLink,
      eventTypeName: eventTypes.name,
      reviewerName: reviewers.name,
      reviewerEmail: reviewers.email,
      timezone: availabilityTemplates.timezone,
    })
    .from(bookings)
    .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
    .innerJoin(availabilityTemplates, eq(eventTypes.availabilityTemplateId, availabilityTemplates.id))
    .innerJoin(reviewers, eq(bookings.reviewerId, reviewers.id))
    .where(
      and(
        inArray(bookings.status, ["confirmed", "rescheduled"]),
        gt(bookings.startTime, now),
        lte(bookings.startTime, inOneHour),
        isNull(bookings.reminderSentAt)
      )
    );
};

export const markBookingReminderSentRepo = async (
  bookingId: number,
  tx: DbOrTx = db
) => {
  return tx
    .update(bookings)
    .set({ reminderSentAt: new Date() })
    .where(eq(bookings.id, bookingId));
};

export const bookingRepository = {
  getEventTimezone: getEventTimezoneRepo,
  getOwnedBookingOrThrow: getOwnedBookingOrThrowRepo,
  releaseBookingSlot: releaseBookingSlotRepo,
  checkCrossEventConflict: checkCrossEventConflictRepo,
  findHeldSlotByToken: findHeldSlotByTokenRepo,
  findEventTypePriceById: findEventTypePriceByIdRepo,
  findPaymentByOrderId: findPaymentByOrderIdRepo,
  findExistingPaymentByPaymentIdExcluding: findExistingPaymentByPaymentIdExcludingRepo,
  insertBooking: insertBookingRepo,
  linkPaymentToBooking: linkPaymentToBookingRepo,
  findReviewerWallet: findReviewerWalletRepo,
  creditReviewerWalletEscrow: creditReviewerWalletEscrowRepo,
  createReviewerWallet: createReviewerWalletRepo,
  insertWalletEscrowTransaction: insertWalletEscrowTransactionRepo,
  markSlotBooked: markSlotBookedRepo,
  findBookingFinalizeDetails: findBookingFinalizeDetailsRepo,
  updateBookingMeetingDetails: updateBookingMeetingDetailsRepo,
  findMyBookings: findMyBookingsRepo,
  findBookingDetailsById: findBookingDetailsByIdRepo,
  findEventTypeNameById: findEventTypeNameByIdRepo,
  findReviewerContactById: findReviewerContactByIdRepo,
  cancelBookingInDb: cancelBookingInDbRepo,
  updateBookingRescheduled: updateBookingRescheduledRepo,
  bookSlotWithResetHold: bookSlotWithResetHoldRepo,
  updateEscrowAvailableAtForBooking: updateEscrowAvailableAtForBookingRepo,
  updateBookingRescheduleRequested: updateBookingRescheduleRequestedRepo,
  findRescheduleRequestByToken: findRescheduleRequestByTokenRepo,
  findRescheduleReviewer: findRescheduleReviewerRepo,
  findRescheduleEventType: findRescheduleEventTypeRepo,
  findPaymentByBookingId: findPaymentByBookingIdRepo,
  acceptRescheduleRequest: acceptRescheduleRequestRepo,
  declineRescheduleRequest: declineRescheduleRequestRepo,
  findFeedbackByBookingIdExists: findFeedbackByBookingIdExistsRepo,
  updateBookingOutcome: updateBookingOutcomeRepo,
  findUpcomingBookingsNeedingReminders: findUpcomingBookingsNeedingRemindersRepo,
  markBookingReminderSent: markBookingReminderSentRepo,
};
