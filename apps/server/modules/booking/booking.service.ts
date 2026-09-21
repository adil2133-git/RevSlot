import crypto from "crypto";
import dayjs from "../../config/dayjs.js";
import { z } from "zod";
import { eq, and, ne, inArray, gte, lte, lt, sql } from "drizzle-orm";
import { db } from "../../config/db.js";
import { slots } from "../slot/slots.schema.js";
import { bookings } from "./bookings.schema.js";
import { AppError } from "../../core/errors/AppError.js";
import type { CreateBookingInput, CancelBookingInput, RescheduleBookingInput, RequestRescheduleInput, RespondRescheduleInput } from "./booking.validation.js";
import { eventTypes } from "../eventType/eventTypes.schema.js";
import { reviewers } from "../auth/reviewers.schema.js";
import { calendarService } from "../calendar/calendar.service.js";
import { emailService } from "../../services/email.service.js";
import { bookingConfirmationTemplate, bookingConfirmationTemplateData } from "../../emails/templates/bookingConfirmation.js";
import { bookingCancelledTemplate, bookingCancelledTemplateData } from "../../emails/templates/bookingCancelled.js";
import { bookingRescheduledTemplate, bookingRescheduledTemplateData } from "../../emails/templates/bookingRescheduled.js";
import { bookingRescheduleRequestedTemplate, bookingRescheduleRequestedTemplateData } from "../../emails/templates/bookingRescheduleRequested.js";
import { slotService } from "../slot/slot.service.js"; 
import { feedback } from "../feedback/feedback.schema.js";
import { BOOKING_FIELD_DEFINITIONS } from "./bookingFields.js";
import { meetingService } from "../meeting/meeting.service.js";
import { payments } from "../payment/payments.schema.js";
import { reviewerWallets, walletTransactions } from "../wallet/wallet.schema.js";
import { refundService } from "../payment/refund.service.js";
import { bookingDisputes } from "../dispute/disputes.schema.js";
import { availabilityTemplates } from "../availability/schema/availabilityTemplates.schema.js";

export interface GetMyBookingsOptions {

  page: number;
  limit: number;
  status?: ("confirmed" | "completed" | "rescheduled" | "cancelled" | "no_show" | "reschedule_requested")[] | undefined;
  scope?: "upcoming" | "past" | "ongoing" | undefined;
  search?: string | undefined;
}

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const CANCEL_CUTOFF_HOURS = 3;

const getEventTimezone = async (eventTypeId: number): Promise<string> => {
  const [templateRow] = await db
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

const getOwnedBookingOrThrow = async (reviewerId: number, bookingId: number) => {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.reviewerId, reviewerId)))
    .limit(1);

  if (!booking) {
    throw new AppError("Booking not found or access denied", 404);
  }

  return booking;
};

const assertOutsideCutoff = (startTime: Date) => {
  const cutoffTime = dayjs().add(CANCEL_CUTOFF_HOURS, "hour");

  if (dayjs(startTime).isBefore(cutoffTime)) {
    throw new AppError(
      `Actions cannot be performed within ${CANCEL_CUTOFF_HOURS} hours of the session start time`,
      400
    );
  }
};

const releaseBookingSlot = async (tx: Transaction, booking: typeof bookings.$inferSelect) => {
  const timezone = await getEventTimezone(booking.eventTypeId);
  const slotDate = dayjs(booking.startTime).tz(timezone).format("YYYY-MM-DD");
  const startTime = dayjs(booking.startTime).tz(timezone).format("HH:mm:ss");
  const endTime = dayjs(booking.endTime).tz(timezone).format("HH:mm:ss");

  await tx
    .update(slots)
    .set({ status: "available", holdToken: null, holdExpiresAt: null, updatedAt: new Date() })
    .where(
      and(
        eq(slots.eventTypeId, booking.eventTypeId),
        eq(slots.slotDate, slotDate),
        eq(slots.startTime, startTime),
        eq(slots.endTime, endTime),
        eq(slots.status, "booked")
      )
    );
};

export const bookingService = {
  checkCrossEventConflict: async (
    reviewerId: number,
    slotDate: string,
    startTime: string,
    endTime: string,
    excludeSlotId: number,
    timezone: string = "Asia/Kolkata"
  ) => {
    // 1. Check slots table
    const conflicts = await db
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

    // 2. Check bookings table
    const targetStart = dayjs.tz(`${slotDate} ${startTime}`, timezone).toDate();
    const targetEnd = dayjs.tz(`${slotDate} ${endTime}`, timezone).toDate();

    const bookingConflicts = await db
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
  },

  createBooking: async (data: CreateBookingInput) => {
    return db.transaction(async (tx) => {
      const [slot] = await tx
        .select()
        .from(slots)
        .where(
          and(
            eq(slots.holdToken, data.holdToken),
            eq(slots.status, "held"),
            sql`${slots.holdExpiresAt} > now()`
          )
        )
        .limit(1);

      if (!slot) {
        throw new AppError(
          "Hold expired or invalid — please select the slot again",
          410
        );
      }

      const timezone = await getEventTimezone(slot.eventTypeId);

      const hasConflict = await bookingService.checkCrossEventConflict(
        slot.reviewerId,
        slot.slotDate,
        slot.startTime,
        slot.endTime,
        slot.id,
        timezone
      );

      if (hasConflict) {
        throw new AppError(
          "This time is no longer available — it overlaps with another booking",
          409
        );
      }

      const [priceCheckEventType] = await tx
        .select({ price: eventTypes.price })
        .from(eventTypes)
        .where(eq(eventTypes.id, slot.eventTypeId))
        .limit(1);

      let verifiedPayment: typeof payments.$inferSelect | null = null;

      if (priceCheckEventType && priceCheckEventType.price > 0) {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = data;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
          throw new AppError("Payment is required for this session", 402);
        }

        const expectedSignature = crypto
          .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
          .update(`${razorpayOrderId}|${razorpayPaymentId}`)
          .digest("hex");

        if (expectedSignature !== razorpaySignature) {
          throw new AppError("Payment verification failed", 400);
        }

        // Match order record in database and verify amount
        const [paymentRecord] = await tx
          .select()
          .from(payments)
          .where(eq(payments.razorpayOrderId, razorpayOrderId))
          .limit(1);

        if (!paymentRecord) {
          throw new AppError("Payment order not found in database", 404);
        }

        if (paymentRecord.bookingId) {
          throw new AppError("This payment has already been redeemed", 400);
        }

        if (paymentRecord.amount !== priceCheckEventType.price * 100) {
          throw new AppError("Payment amount mismatch", 400);
        }

        // Replay prevention: check if this payment ID was already used for ANOTHER payment record
        const [existingPayment] = await tx
          .select({ id: payments.id })
          .from(payments)
          .where(
            and(
              eq(payments.razorpayPaymentId, razorpayPaymentId),
              ne(payments.id, paymentRecord.id)
            )
          )
          .limit(1);

        if (existingPayment) {
          throw new AppError("This payment has already been redeemed", 400);
        }

        verifiedPayment = paymentRecord;
      }

      const startTimestamp = dayjs.tz(
        `${slot.slotDate} ${slot.startTime}`,
        timezone
      ).toDate();
      const endTimestamp = dayjs.tz(
        `${slot.slotDate} ${slot.endTime}`,
        timezone
      ).toDate();


  const allowedKeys = new Set<string>([
  "fullName",
  "email",
  "whatsappNumber",
  "mainlyFocusedFor",
  "comments",
  ...Object.keys(BOOKING_FIELD_DEFINITIONS),
]);

  const submittedFormData: Record<string, string> =
  data.formData ?? {};

 const formData = Object.fromEntries(
  Object.entries(submittedFormData)
    .filter(([key]) => allowedKeys.has(key))
    .map(([key, value]) => [key, value.trim()])
);

    const requiredFields = [
  "fullName",
  "email",
  "whatsappNumber",
  "mainlyFocusedFor",
] as const;

for (const key of requiredFields) {
  if (!formData[key]) {
    throw new AppError(`${key} is required`, 400);
  }
}

if (!z.string().email().safeParse(formData.email).success) {
  throw new AppError("Invalid email address", 400);
}

if (
  !formData.whatsappNumber ||
  !/^\d+$/.test(formData.whatsappNumber)
) {
  throw new AppError("WhatsApp number must contain digits only", 400);
}

for (const [key, value] of Object.entries(formData)) {
  const definition =
    BOOKING_FIELD_DEFINITIONS[
      key as keyof typeof BOOKING_FIELD_DEFINITIONS
    ];

  if (!definition || !value) continue;

  if (
    definition.type === "email" &&
    !z.string().email().safeParse(value).success
  ) {
    throw new AppError(`Invalid ${definition.label}`, 400);
  }

  if (
    definition.type === "url" &&
    !z.string().url().safeParse(value).success
  ) {
    throw new AppError(`Invalid ${definition.label}`, 400);
  }
}

      const [booking] = await tx
        .insert(bookings)
        .values({
           eventTypeId: slot.eventTypeId,
           reviewerId: slot.reviewerId,
           internName: formData.internName || formData.fullName || "",
           batch: formData.batch || "",
           advisorName: formData.advisorName || formData.fullName || "",
           advisorEmail: formData.advisorEmail || formData.email || "",
           internEmails: formData.internEmail
            ? [formData.internEmail]
            : undefined,
           weekStage: formData.weekStage || "",

          // New dynamic booking form data
           formData,

           startTime: startTimestamp,
           endTime: endTimestamp,
           status: "confirmed",
           razorpayOrderId: data.razorpayOrderId,
           razorpayPaymentId: data.razorpayPaymentId,
       })
        .returning();

      if (!booking) {
        throw new AppError("Failed to create booking", 500);
      }

      if (verifiedPayment) {
        await tx
          .update(payments)
          .set({
            bookingId: booking.id,
            razorpayPaymentId: data.razorpayPaymentId,
            advisorEmail: formData.advisorEmail || formData.email,
            status: "captured",
            updatedAt: new Date(),
          })
          .where(eq(payments.id, verifiedPayment.id));

        // Credit reviewer wallet escrow
        const [wallet] = await tx
          .select()
          .from(reviewerWallets)
          .where(eq(reviewerWallets.reviewerId, slot.reviewerId))
          .limit(1);

        if (wallet) {
          await tx
            .update(reviewerWallets)
            .set({
              pendingBalance: wallet.pendingBalance + verifiedPayment.amount,
              updatedAt: new Date(),
            })
            .where(eq(reviewerWallets.id, wallet.id));
        } else {
          await tx.insert(reviewerWallets).values({
            reviewerId: slot.reviewerId,
            pendingBalance: verifiedPayment.amount,
            availableBalance: 0,
            withdrawnBalance: 0,
          });
        }

        await tx.insert(walletTransactions).values({
          reviewerId: slot.reviewerId,
          bookingId: booking.id,
          type: "credit_escrow",
          amount: verifiedPayment.amount,
          status: "completed",
          description: `Booking #${booking.id} confirmed: ₹${(verifiedPayment.amount / 100).toFixed(2)} held in escrow`,
          availableAt: dayjs(endTimestamp).add(48, "hour").toDate(),
        });
      }

      await tx
        .update(slots)
        .set({ status: "booked", updatedAt: new Date() })
        .where(eq(slots.id, slot.id));

      return booking;
    });
  },

  finalizeBooking: async (booking: {
    id: number;
    eventTypeId: number;
    reviewerId: number;
    internName: string;
    advisorName: string;
    advisorEmail: string;
    internEmails: string[] | null;
    weekStage: string;
    startTime: Date;
    endTime: Date;
  }) => {
    const [eventType] = await db
      .select({
        name: eventTypes.name,
        price: eventTypes.price,
      })
      .from(eventTypes)
      .where(eq(eventTypes.id, booking.eventTypeId))
      .limit(1);

    const [reviewer] = await db
      .select({ name: reviewers.name, email: reviewers.email })
      .from(reviewers)
      .where(eq(reviewers.id, booking.reviewerId))
      .limit(1);

    const [bookingPayment] = await db
      .select({
        razorpayPaymentId: payments.razorpayPaymentId,
      })
      .from(payments)
      .where(eq(payments.bookingId, booking.id))
      .limit(1);

    if (!eventType || !reviewer) return { meetLink: null };

    const timezone = "Asia/Kolkata";

    const internalMeetingLink =
       meetingService.getMeetingLink(booking.id);

    const meetLink: string | null = internalMeetingLink;

    try {
      const meetEvent = await calendarService.createMeetEvent({
        reviewerId: booking.reviewerId,
        summary: `${eventType.name} — ${booking.advisorName}`,
        description: `RevSlot session: ${eventType.name} (${booking.weekStage})`,
        startTime: booking.startTime,
        endTime: booking.endTime,
        timezone,
        attendeeEmails: [
          reviewer.email,
          booking.advisorEmail,
          ...(booking.internEmails ?? []),
        ],
        meetingLink: internalMeetingLink,
      });

      if (meetEvent) {
      await db
  .update(bookings)
  .set({
    meetLink: internalMeetingLink,
    googleEventId: meetEvent.googleEventId,
  })
  .where(eq(bookings.id, booking.id));
      }
    } catch (err) {
      console.error(
        `[Booking] Meet event creation failed for booking ${booking.id}:`,
        err
      );
    }

  await db
  .update(bookings)
  .set({
    meetLink: internalMeetingLink,
  })
  .where(eq(bookings.id, booking.id));

    const formattedDate = dayjs(booking.startTime).format("ddd, MMM D");

    const formattedTime = `${dayjs(booking.startTime).format(
      "h:mm A"
    )} – ${dayjs(booking.endTime).format("h:mm A")} (${timezone})`;

    const recipients: {
      email: string;
      name: string;
      role: "advisor" | "reviewer" | "intern";
    }[] = [
        {
          email: booking.advisorEmail,
          name: booking.advisorName,
          role: "advisor",
        },
        {
          email: reviewer.email,
          name: reviewer.name,
          role: "reviewer",
        },
        ...(booking.internEmails ?? []).map((email) => ({
          email,
          name: booking.internName,
          role: "intern" as const,
        })),
      ];

    await Promise.all(
      recipients.map(({ email, name, role }) => {
        const { html: fallbackHtml } = bookingConfirmationTemplate({
          recipientName: name,
          recipientRole: role,
          eventTypeName: eventType.name,
          reviewerName: reviewer.name,
          internName: booking.internName,
          advisorName: booking.advisorName,
          formattedDate,
          formattedTime,
          meetLink,
          price: eventType.price,
          paymentId: bookingPayment?.razorpayPaymentId,
        });
        const { templateId, subject, variables } = bookingConfirmationTemplateData({
          recipientName: name,
          recipientRole: role,
          eventTypeName: eventType.name,
          reviewerName: reviewer.name,
          internName: booking.internName,
          advisorName: booking.advisorName,
          formattedDate,
          formattedTime,
          meetLink,
          price: eventType.price,
          paymentId: bookingPayment?.razorpayPaymentId,
        });

        return emailService
          .sendTemplateEmail({
            to: email,
            templateId,
            subject,
            variables,
            fallbackHtml,
          })
          .catch((err) => {
            console.error(
              `[Booking] Failed to send confirmation email to ${email}:`,
              err
            );
          });
      })
    );

    return { meetLink };
  },

  // Reviewer's own bookings — paginated, filterable by status, and scoped
  // to upcoming/past. Joins eventTypes for name/id/bookingWindowDays so
  // the frontend can open the reschedule modal without a second fetch.
  getMyBookings: async (
    reviewerId: number,
    options: GetMyBookingsOptions
  ) => {
    const { page, limit, status, scope, search } = options;
    const offset = (page - 1) * limit;
    const now = new Date();

    const conditions = [eq(bookings.reviewerId, reviewerId)];

    if (status && status.length > 0) {
      conditions.push(inArray(bookings.status, status));
    }

    if (scope === "upcoming") {
      conditions.push(gte(bookings.startTime, now));
    } else if (scope === "past") {
      conditions.push(lt(bookings.startTime, now));
    } else if (scope === "ongoing") {
      conditions.push(lte(bookings.startTime, now));
      conditions.push(gte(bookings.endTime, now));
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

    const orderBy = scope === "upcoming" || scope === "ongoing"
      ? sql`${bookings.startTime} ASC`
      : sql`${bookings.createdAt} DESC`;

    const reviewerCondition = eq(bookings.reviewerId, reviewerId);

    const [rows, countResult, countsRes] = await Promise.all([
      db
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
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookings)
        .where(and(...conditions)),
      db
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

    const bookingsWithMeetingLinks = rows.map((r) => {
      const {
        disputeId,
        disputeReason,
        disputeDescription,
        disputeStatus,
        disputeAdminNotes,
        disputeCreatedAt,
        disputeResolvedAt,
        ...booking
      } = r;

      return {
        ...booking,
        meetLink: meetingService.getMeetingLink(booking.id),
        dispute: disputeId
          ? {
              id: disputeId,
              reason: disputeReason,
              description: disputeDescription,
              status: disputeStatus,
              adminNotes: disputeAdminNotes,
              createdAt: disputeCreatedAt ? disputeCreatedAt.toISOString() : null,
              resolvedAt: disputeResolvedAt ? disputeResolvedAt.toISOString() : null,
            }
          : null,
      };
    });

    return {
      bookings:  bookingsWithMeetingLinks,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      counts: countsRes[0] ?? defaultCounts,
    };
  },

  getBookingById: async (reviewerId: number, bookingId: number) => {
    const [row] = await db
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

    if (!row) {
      throw new AppError("Booking not found", 404);
    }

    return row;
  },

  cancelBooking: async (reviewerId: number, bookingId: number, data: CancelBookingInput) => {
    const booking = await getOwnedBookingOrThrow(reviewerId, bookingId);

    if (booking.status !== "confirmed" && booking.status !== "rescheduled") {
      throw new AppError("Only confirmed or rescheduled bookings can be cancelled", 400);
    }

    assertOutsideCutoff(booking.startTime);

    const [eventType] = await db
      .select({ name: eventTypes.name })
      .from(eventTypes)
      .where(eq(eventTypes.id, booking.eventTypeId))
      .limit(1);

    const [reviewer] = await db
      .select({ name: reviewers.name, email: reviewers.email })
      .from(reviewers)
      .where(eq(reviewers.id, reviewerId))
      .limit(1);

    const updated = await db.transaction(async (tx) => {
      const [result] = await tx
        .update(bookings)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
          cancelledReason: data.reason,
        })
        .where(eq(bookings.id, bookingId))
        .returning();

      await releaseBookingSlot(tx, booking);

      return result;
    });

    if (booking.googleEventId) {
      await calendarService.cancelMeetEvent(reviewerId, booking.googleEventId).catch((err) => {
        console.error(`[Booking] Failed to cancel Calendar event for booking ${bookingId}:`, err);
      });
    }

    if (eventType && reviewer) {
      const formattedDate = dayjs(booking.startTime).format("ddd, MMM D");
      const formattedTime = `${dayjs(booking.startTime).format("h:mm A")} – ${dayjs(booking.endTime).format("h:mm A")}`;

      const recipients: { email: string; name: string; role: "advisor" | "reviewer" | "intern" }[] = [
        { email: booking.advisorEmail, name: booking.advisorName, role: "advisor" },
        { email: reviewer.email, name: reviewer.name, role: "reviewer" },
        ...(booking.internEmails ?? []).map((email) => ({
          email,
          name: booking.internName,
          role: "intern" as const,
        })),
      ];

      // Process automatic 100% refund for reviewer cancellation
      const refundResult = await refundService.processBookingRefund({
        bookingId,
        initiatedBy: "reviewer",
        reason: data.reason,
      }).catch((err) => {
        console.error(`[Booking] Automated refund failed on reviewer cancel for booking ${bookingId}:`, err);
        return null;
      });

      const refundStatusText = refundResult?.refundAmount && refundResult.refundAmount > 0
        ? `Full 100% refund of ₹${(refundResult.refundAmount / 100).toFixed(2)} initiated via Razorpay (credited within 5–7 business days).`
        : null;

      await Promise.all(
        recipients.map(({ email, name, role }) => {
          const { html: fallbackHtml } = bookingCancelledTemplate({
            recipientName: name,
            recipientRole: role,
            eventTypeName: eventType.name,
            reviewerName: reviewer.name,
            advisorName: booking.advisorName,
            formattedDate,
            formattedTime,
            reason: data.reason,
            refundStatusText,
          });
          const { templateId, subject, variables } = bookingCancelledTemplateData({
            recipientName: name,
            recipientRole: role,
            eventTypeName: eventType.name,
            reviewerName: reviewer.name,
            advisorName: booking.advisorName,
            formattedDate,
            formattedTime,
            reason: data.reason,
            refundStatusText,
          });
          return emailService.sendTemplateEmail({ to: email, templateId, subject, variables, fallbackHtml }).catch((err) => {
            console.error(`[Booking] Failed to send cancellation email to ${email}:`, err);
          });
        })
      );
    }

    return updated;
  },

  rescheduleBooking: async (reviewerId: number, bookingId: number, data: RescheduleBookingInput) => {
    const booking = await getOwnedBookingOrThrow(reviewerId, bookingId);

    if (booking.status !== "confirmed" && booking.status !== "rescheduled") {
      throw new AppError("Only confirmed or rescheduled bookings can be rescheduled", 400);
    }

    assertOutsideCutoff(booking.startTime);

    const hold = await slotService.holdSlot({
      eventTypeId: booking.eventTypeId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
    });

    const timezone = await getEventTimezone(booking.eventTypeId);
    const newStartTime = dayjs.tz(`${data.date} ${data.startTime}`, timezone).toDate();
    const newEndTime = dayjs.tz(`${data.date} ${data.endTime}`, timezone).toDate();

    const updatedBooking = await db.transaction(async (tx) => {
      // Release old slot occupied by previous start/end time
      await releaseBookingSlot(tx, booking);

      // Update existing booking row in place with status 'rescheduled'
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

      if (!updated) {
        throw new AppError("Failed to reschedule booking", 500);
      }

      // Mark the new slot as booked
      await tx
        .update(slots)
        .set({ status: "booked", holdToken: null, holdExpiresAt: null, updatedAt: new Date() })
        .where(eq(slots.id, hold.slotId));

      // Update escrow maturity time to 48 hours after new end time
      await tx
        .update(walletTransactions)
        .set({ availableAt: dayjs(newEndTime).add(48, "hour").toDate() })
        .where(and(eq(walletTransactions.bookingId, bookingId), eq(walletTransactions.type, "credit_escrow")));

      return updated;
    });

    if (booking.googleEventId) {
      await calendarService.cancelMeetEvent(reviewerId, booking.googleEventId).catch((err) => {
        console.error(`[Booking] Failed to cancel old Calendar event for booking ${bookingId}:`, err);
      });
    }

    return updatedBooking;
  },

  requestReschedule: async (reviewerId: number, bookingId: number, data: RequestRescheduleInput) => {
    const booking = await getOwnedBookingOrThrow(reviewerId, bookingId);

    if (booking.status !== "confirmed" && booking.status !== "rescheduled" && booking.status !== "reschedule_requested") {
      throw new AppError("Only confirmed or rescheduled bookings can have a reschedule requested", 400);
    }

    assertOutsideCutoff(booking.startTime);

    // Hold the proposed slot
    await slotService.holdSlot({
      eventTypeId: booking.eventTypeId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
    });

    const timezone = await getEventTimezone(booking.eventTypeId);
    const proposedStartTime = dayjs.tz(`${data.date} ${data.startTime}`, timezone).toDate();
    const proposedEndTime = dayjs.tz(`${data.date} ${data.endTime}`, timezone).toDate();
    const rescheduleToken = crypto.randomUUID();
    const rescheduleTokenExpiresAt = dayjs().add(48, "hour").toDate();

    const [updated] = await db
      .update(bookings)
      .set({
        status: "reschedule_requested",
        proposedStartTime,
        proposedEndTime,
        rescheduleRequestedBy: "reviewer",
        rescheduleReason: data.reason || null,
        rescheduleToken,
        rescheduleTokenExpiresAt,
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    const [eventType] = await db
      .select({ name: eventTypes.name })
      .from(eventTypes)
      .where(eq(eventTypes.id, booking.eventTypeId))
      .limit(1);

    const [reviewer] = await db
      .select({ name: reviewers.name, email: reviewers.email })
      .from(reviewers)
      .where(eq(reviewers.id, reviewerId))
      .limit(1);

    if (eventType && reviewer) {
      const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
      const actionUrl = `${CLIENT_URL}/reschedule-request/${rescheduleToken}`;
      const currentFormattedDate = dayjs(booking.startTime).format("ddd, MMM D, YYYY");
      const currentFormattedTime = `${dayjs(booking.startTime).format("h:mm A")} – ${dayjs(booking.endTime).format("h:mm A")}`;
      const proposedFormattedDate = dayjs(proposedStartTime).format("ddd, MMM D, YYYY");
      const proposedFormattedTime = `${dayjs(proposedStartTime).format("h:mm A")} – ${dayjs(proposedEndTime).format("h:mm A")}`;

      const recipients = [
        { email: booking.advisorEmail, name: booking.advisorName },
        ...(booking.internEmails ?? []).map((email) => ({ email, name: booking.internName })),
      ];

      await Promise.all(
        recipients.map(({ email, name }) => {
          const { html: fallbackHtml } = bookingRescheduleRequestedTemplate({
            recipientName: name,
            eventTypeName: eventType.name,
            reviewerName: reviewer.name,
            advisorName: booking.advisorName,
            internName: booking.internName,
            currentFormattedDate,
            currentFormattedTime,
            proposedFormattedDate,
            proposedFormattedTime,
            reason: data.reason,
            actionUrl,
          });
          const { templateId, subject, variables } = bookingRescheduleRequestedTemplateData({
            recipientName: name,
            eventTypeName: eventType.name,
            reviewerName: reviewer.name,
            advisorName: booking.advisorName,
            internName: booking.internName,
            currentFormattedDate,
            currentFormattedTime,
            proposedFormattedDate,
            proposedFormattedTime,
            reason: data.reason,
            actionUrl,
          });
          return emailService.sendTemplateEmail({ to: email, templateId, subject, variables, fallbackHtml }).catch((err) => {
            console.error(`[Booking] Failed to send reschedule request email to ${email}:`, err);
          });
        })
      );
    }

    return updated;
  },

  getRescheduleRequestByToken: async (token: string) => {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.rescheduleToken, token), eq(bookings.status, "reschedule_requested")))
      .limit(1);

    if (!booking) {
      throw new AppError("Reschedule request not found or link has expired", 404);
    }

    if (booking.rescheduleTokenExpiresAt && dayjs().isAfter(dayjs(booking.rescheduleTokenExpiresAt))) {
      throw new AppError("This reschedule request link has expired", 410);
    }

    const [reviewer] = await db
      .select({ id: reviewers.id, name: reviewers.name, email: reviewers.email })
      .from(reviewers)
      .where(eq(reviewers.id, booking.reviewerId))
      .limit(1);

    const [eventType] = await db
      .select({
        id: eventTypes.id,
        name: eventTypes.name,
        durationMinutes: eventTypes.durationMinutes,
        slug: eventTypes.slug,
        price: eventTypes.price,
      })
      .from(eventTypes)
      .where(eq(eventTypes.id, booking.eventTypeId))
      .limit(1);

    const [payment] = await db
      .select({
        amount: payments.amount,
        status: payments.status,
        razorpayPaymentId: payments.razorpayPaymentId,
      })
      .from(payments)
      .where(eq(payments.bookingId, booking.id))
      .limit(1);

    return {
      booking: {
        ...booking,
        price: eventType?.price ?? 0,
        paymentStatus: payment?.status ?? null,
        paymentAmount: payment?.amount ?? null,
      },
      reviewer,
      eventType,
      payment: payment || null,
    };
  },

  respondToReschedule: async (token: string, data: RespondRescheduleInput) => {
    const { booking, reviewer, eventType } = await bookingService.getRescheduleRequestByToken(token);

    if (data.action === "accept") {
      if (!booking.proposedStartTime || !booking.proposedEndTime) {
        throw new AppError("No proposed time found for this reschedule request", 400);
      }
      const newStartTime = booking.proposedStartTime;
      const newEndTime = booking.proposedEndTime;

      const updatedBooking = await db.transaction(async (tx) => {
        await releaseBookingSlot(tx, booking);

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
          .where(eq(bookings.id, booking.id))
          .returning();

        if (!updated) {
          throw new AppError("Failed to update booking", 500);
        }

        return updated;
      });

      if (booking.googleEventId) {
        await calendarService.cancelMeetEvent(booking.reviewerId, booking.googleEventId).catch((err) => {
          console.error(`[Booking] Failed to cancel old Calendar event for booking ${booking.id}:`, err);
        });
      }

  await bookingService.finalizeReschedule({
    startTime: booking.startTime,
    endTime: booking.endTime,
  },
  {
    id: updatedBooking.id,
    eventTypeId: updatedBooking.eventTypeId,
    reviewerId: updatedBooking.reviewerId,
    internName: updatedBooking.internName,
    advisorName: updatedBooking.advisorName,
    advisorEmail: updatedBooking.advisorEmail,
    internEmails: updatedBooking.internEmails,
    weekStage: updatedBooking.weekStage,
    startTime: updatedBooking.startTime,
    endTime: updatedBooking.endTime,
  }
);

      return updatedBooking;

    } else if (data.action === "counter") {
      if (!data.date || !data.startTime || !data.endTime) {
        throw new AppError("Date, start time, and end time are required to pick a new slot", 400);
      }

      const hold = await slotService.holdSlot({
        eventTypeId: booking.eventTypeId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
      });

      const timezone = await getEventTimezone(booking.eventTypeId);
      const newStartTime = dayjs.tz(`${data.date} ${data.startTime}`, timezone).toDate();
      const newEndTime = dayjs.tz(`${data.date} ${data.endTime}`, timezone).toDate();

      const updatedBooking = await db.transaction(async (tx) => {
        await releaseBookingSlot(tx, booking);

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
          .where(eq(bookings.id, booking.id))
          .returning();

        if (!updated) {
          throw new AppError("Failed to update booking", 500);
        }

        await tx
          .update(slots)
          .set({ status: "booked", holdToken: null, holdExpiresAt: null, updatedAt: new Date() })
          .where(eq(slots.id, hold.slotId));

        return updated;
      });

      if (booking.googleEventId) {
        await calendarService.cancelMeetEvent(booking.reviewerId, booking.googleEventId).catch((err) => {
          console.error(`[Booking] Failed to cancel old Calendar event for booking ${booking.id}:`, err);
        });
      }

      await bookingService.finalizeReschedule(
  {
    startTime: booking.startTime,
    endTime: booking.endTime,
  },
  {
    id: updatedBooking.id,
    eventTypeId: updatedBooking.eventTypeId,
    reviewerId: updatedBooking.reviewerId,
    internName: updatedBooking.internName,
    advisorName: updatedBooking.advisorName,
    advisorEmail: updatedBooking.advisorEmail,
    internEmails: updatedBooking.internEmails,
    weekStage: updatedBooking.weekStage,
    startTime: updatedBooking.startTime,
    endTime: updatedBooking.endTime,
  }
);

      return updatedBooking;

    } else if (data.action === "decline") {
      const reason = data.declineReason || "Reschedule request declined by advisor";

      const cancelledBooking = await db.transaction(async (tx) => {
        await releaseBookingSlot(tx, booking);

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
          .where(eq(bookings.id, booking.id))
          .returning();

        return updated;
      });

      if (booking.googleEventId) {
        await calendarService.cancelMeetEvent(booking.reviewerId, booking.googleEventId).catch((err) => {
          console.error(`[Booking] Failed to cancel Calendar event:`, err);
        });
      }

      // Automatically issue full 100% refund since client declined reviewer's reschedule request
      const refundResult = await refundService.processBookingRefund({
        bookingId: booking.id,
        initiatedBy: "reschedule_decline",
        reason,
      }).catch((err) => {
        console.error(`[Booking] Automated refund failed on reschedule decline for booking ${booking.id}:`, err);
        return null;
      });

      const refundStatusText = refundResult?.refundAmount && refundResult.refundAmount > 0
        ? `Full 100% refund of ₹${(refundResult.refundAmount / 100).toFixed(2)} initiated via Razorpay (credited within 5–7 business days).`
        : null;

      if (eventType && reviewer) {
        const formattedDate = dayjs(booking.startTime).format("ddd, MMM D, YYYY");
        const formattedTime = `${dayjs(booking.startTime).format("h:mm A")} – ${dayjs(booking.endTime).format("h:mm A")}`;

        const recipients = [
          { email: booking.advisorEmail, name: booking.advisorName, role: "advisor" as const },
          { email: reviewer.email, name: reviewer.name, role: "reviewer" as const },
          ...(booking.internEmails ?? []).map((email) => ({ email, name: booking.internName, role: "intern" as const })),
        ];

        await Promise.all(
          recipients.map(({ email, name, role }) => {
            const { html: fallbackHtml } = bookingCancelledTemplate({
              recipientName: name,
              recipientRole: role,
              eventTypeName: eventType.name,
              reviewerName: reviewer.name,
              advisorName: booking.advisorName,
              formattedDate,
              formattedTime,
              reason,
              refundStatusText,
            });
            const { templateId, subject, variables } = bookingCancelledTemplateData({
              recipientName: name,
              recipientRole: role,
              eventTypeName: eventType.name,
              reviewerName: reviewer.name,
              advisorName: booking.advisorName,
              formattedDate,
              formattedTime,
              reason,
              refundStatusText,
            });
            return emailService.sendTemplateEmail({ to: email, templateId, subject, variables, fallbackHtml }).catch((err) => {
              console.error(`[Booking] Failed to send cancellation email to ${email}:`, err);
            });
          })
        );
      }

      return cancelledBooking;
    }
  },

  markOutcome: async (
    reviewerId: number,
    bookingId: number,
    outcome: "completed" | "no_show"
  ) => {
    const booking = await getOwnedBookingOrThrow(reviewerId, bookingId);

    if (booking.status === outcome) {
      throw new AppError(
        `Booking is already marked as ${outcome === "completed" ? "completed" : "no-show"}`,
        400
      );
    }
    const [existingFeedback] = await db
      .select({ id: feedback.id })
      .from(feedback)
      .where(eq(feedback.bookingId, bookingId))
      .limit(1);

    if (booking.status === "completed" && existingFeedback) {
      throw new AppError(
        "Booking outcome cannot be changed after feedback has been submitted",
        400
      );
    }

    if (
      booking.status !== "confirmed" &&
      booking.status !== "rescheduled" &&
      booking.status !== "completed" &&
      booking.status !== "no_show"
    ) {
      throw new AppError("This booking outcome cannot be changed", 400);
    }

    const now = Date.now();
    const graceEnd =
      booking.startTime.getTime() + 10 * 60 * 1000; // 10-min no-show grace period
    const sessionEnd = booking.endTime.getTime();

    if (outcome === "no_show" && now < graceEnd) {
      throw new AppError(
        "No-show can only be marked after the 10-minute grace period",
        400
      );
    }

    if (outcome === "completed" && now < sessionEnd) {
      throw new AppError(
        "This session can only be marked completed after it has ended",
        400
      );
    }

    const [updated] = await db
      .update(bookings)
      .set({ status: outcome })
      .where(and(eq(bookings.id, bookingId), eq(bookings.status, booking.status)))
      .returning();

    if (!updated) {
      throw new AppError(
        "This booking was just updated elsewhere. Please refresh and try again.",
        409
      );
    }

    return updated;
  },

  finalizeReschedule: async (
    oldBooking: { startTime: Date; endTime: Date },
    newBooking: {
      id: number;
      eventTypeId: number;
      reviewerId: number;
      internName: string;
      advisorName: string;
      advisorEmail: string;
      internEmails: string[] | null;
      weekStage: string;
      startTime: Date;
      endTime: Date;
    }
  ) => {
    const [eventType] = await db
      .select({ name: eventTypes.name, })
      .from(eventTypes)
      .where(eq(eventTypes.id, newBooking.eventTypeId))
      .limit(1);

    const [reviewer] = await db
      .select({ name: reviewers.name, email: reviewers.email })
      .from(reviewers)
      .where(eq(reviewers.id, newBooking.reviewerId))
      .limit(1);

    if (!eventType || !reviewer) return { meetLink: null };

    const timezone = "Asia/Kolkata";

    const internalMeetingLink =
    meetingService.getMeetingLink(newBooking.id);
    const meetLink: string | null = internalMeetingLink;

    try {
      const meetEvent = await calendarService.createMeetEvent({
        reviewerId: newBooking.reviewerId,
        summary: `${eventType.name} — ${newBooking.advisorName}`,
        description: `RevSlot session: ${eventType.name} (${newBooking.weekStage})`,
        startTime: newBooking.startTime,
        endTime: newBooking.endTime,
        timezone,
        attendeeEmails: [
          reviewer.email,
          newBooking.advisorEmail,
          ...(newBooking.internEmails ?? []),
        ],
        meetingLink: internalMeetingLink,
      });

      if (meetEvent) {
        await db
          .update(bookings)
          .set({ meetLink: internalMeetingLink, googleEventId: meetEvent.googleEventId })
          .where(eq(bookings.id, newBooking.id));
      }
    } catch (err) {
      console.error(`[Booking] Meet event creation failed for rescheduled booking ${newBooking.id}:`, err);
    }

    const oldFormattedDate = dayjs(oldBooking.startTime).format("ddd, MMM D");
    const oldFormattedTime = `${dayjs(oldBooking.startTime).format("h:mm A")} – ${dayjs(oldBooking.endTime).format("h:mm A")}`;
    const newFormattedDate = dayjs(newBooking.startTime).format("ddd, MMM D");
    const newFormattedTime = `${dayjs(newBooking.startTime).format("h:mm A")} – ${dayjs(newBooking.endTime).format("h:mm A")} (${timezone})`;

    const recipients: { email: string; name: string; role: "advisor" | "reviewer" | "intern" }[] = [
      { email: newBooking.advisorEmail, name: newBooking.advisorName, role: "advisor" },
      { email: reviewer.email, name: reviewer.name, role: "reviewer" },
      ...(newBooking.internEmails ?? []).map((email) => ({
        email,
        name: newBooking.internName,
        role: "intern" as const,
      })),
    ];

    await Promise.all(
      recipients.map(({ email, name, role }) => {
        const { html: fallbackHtml } = bookingRescheduledTemplate({
          recipientName: name,
          recipientRole: role,
          eventTypeName: eventType.name,
          reviewerName: reviewer.name,
          advisorName: newBooking.advisorName,
          oldFormattedDate,
          oldFormattedTime,
          newFormattedDate,
          newFormattedTime,
          meetLink,
        });
        const { templateId, subject, variables } = bookingRescheduledTemplateData({
          recipientName: name,
          recipientRole: role,
          eventTypeName: eventType.name,
          reviewerName: reviewer.name,
          advisorName: newBooking.advisorName,
          oldFormattedDate,
          oldFormattedTime,
          newFormattedDate,
          newFormattedTime,
          meetLink,
        });
        return emailService.sendTemplateEmail({ to: email, templateId, subject, variables, fallbackHtml }).catch((err) => {
          console.error(`[Booking] Failed to send reschedule email to ${email}:`, err);
        });
      })
    );

    return { meetLink };
  },
};