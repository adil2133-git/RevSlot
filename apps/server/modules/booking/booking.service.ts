import crypto from "crypto";
import dayjs from "../../config/dayjs.js";
import { z } from "zod";
import { db } from "../../config/db.js";
import type { bookings } from "./bookings.schema.js";
import type { payments } from "../payment/payments.schema.js";
import { AppError } from "../../core/errors/AppError.js";
import type { CreateBookingInput, CancelBookingInput, RescheduleBookingInput, RequestRescheduleInput, RespondRescheduleInput } from "./booking.validation.js";
import { calendarService } from "../calendar/calendar.service.js";
import { emailService } from "../../services/email.service.js";
import { bookingConfirmationTemplate, bookingConfirmationTemplateData } from "../../emails/templates/bookingConfirmation.js";
import { bookingCancelledTemplate, bookingCancelledTemplateData } from "../../emails/templates/bookingCancelled.js";
import { bookingRescheduledTemplate, bookingRescheduledTemplateData } from "../../emails/templates/bookingRescheduled.js";
import { bookingRescheduleRequestedTemplate, bookingRescheduleRequestedTemplateData } from "../../emails/templates/bookingRescheduleRequested.js";
import { slotService } from "../slot/slot.service.js"; 
import { BOOKING_FIELD_DEFINITIONS } from "./bookingFields.js";
import { meetingService } from "../meeting/meeting.service.js";
import { refundService } from "../payment/refund.service.js";
import {
  getEventTimezoneRepo,
  getOwnedBookingOrThrowRepo,
  releaseBookingSlotRepo,
  checkCrossEventConflictRepo,
  findHeldSlotByTokenRepo,
  findEventTypePriceByIdRepo,
  findPaymentByOrderIdRepo,
  findExistingPaymentByPaymentIdExcludingRepo,
  insertBookingRepo,
  linkPaymentToBookingRepo,
  findReviewerWalletRepo,
  creditReviewerWalletEscrowRepo,
  createReviewerWalletRepo,
  insertWalletEscrowTransactionRepo,
  markSlotBookedRepo,
  findBookingFinalizeDetailsRepo,
  updateBookingMeetingDetailsRepo,
  findMyBookingsRepo,
  findBookingDetailsByIdRepo,
  findEventTypeNameByIdRepo,
  findReviewerContactByIdRepo,
  cancelBookingInDbRepo,
  updateBookingRescheduledRepo,
  bookSlotWithResetHoldRepo,
  updateEscrowAvailableAtForBookingRepo,
  updateBookingRescheduleRequestedRepo,
  findRescheduleRequestByTokenRepo,
  findRescheduleReviewerRepo,
  findRescheduleEventTypeRepo,
  findPaymentByBookingIdRepo,
  acceptRescheduleRequestRepo,
  declineRescheduleRequestRepo,
  findFeedbackByBookingIdExistsRepo,
  updateBookingOutcomeRepo,
} from "./booking.repository.js";

export interface GetMyBookingsOptions {
  page: number;
  limit: number;
  status?: ("confirmed" | "completed" | "rescheduled" | "cancelled" | "no_show" | "reschedule_requested")[] | undefined;
  scope?: "upcoming" | "past" | "ongoing" | undefined;
  search?: string | undefined;
  sortBy?: "startTime" | "createdAt" | undefined;
  sortOrder?: "asc" | "desc" | undefined;
}

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const CANCEL_CUTOFF_HOURS = 3;

const getEventTimezone = async (eventTypeId: number): Promise<string> => {
  return getEventTimezoneRepo(eventTypeId);
};

const getOwnedBookingOrThrow = async (reviewerId: number, bookingId: number) => {
  const booking = await getOwnedBookingOrThrowRepo(reviewerId, bookingId);

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

  await releaseBookingSlotRepo(booking.eventTypeId, slotDate, startTime, endTime, tx);
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
    const targetStart = dayjs.tz(`${slotDate} ${startTime}`, timezone).toDate();
    const targetEnd = dayjs.tz(`${slotDate} ${endTime}`, timezone).toDate();

    return checkCrossEventConflictRepo(
      reviewerId,
      slotDate,
      startTime,
      endTime,
      excludeSlotId,
      targetStart,
      targetEnd
    );
  },

  createBooking: async (data: CreateBookingInput) => {
    return db.transaction(async (tx) => {
      const slot = await findHeldSlotByTokenRepo(data.holdToken, tx);

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

      const priceCheckEventType = await findEventTypePriceByIdRepo(slot.eventTypeId, tx);

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
        const paymentRecord = await findPaymentByOrderIdRepo(razorpayOrderId, tx);

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
        const existingPayment = await findExistingPaymentByPaymentIdExcludingRepo(
          razorpayPaymentId,
          paymentRecord.id,
          tx
        );

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
        "clientTimezone",
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

      const booking = await insertBookingRepo({
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
        formData,
        startTime: startTimestamp,
        endTime: endTimestamp,
        status: "confirmed",
        razorpayOrderId: data.razorpayOrderId,
        razorpayPaymentId: data.razorpayPaymentId,
      }, tx);

      if (!booking) {
        throw new AppError("Failed to create booking", 500);
      }

      if (verifiedPayment) {
        await linkPaymentToBookingRepo(
          verifiedPayment.id,
          booking.id,
          data.razorpayPaymentId!,
          (formData.advisorEmail || formData.email || ""),
          tx
        );

        // Credit reviewer wallet escrow
        const wallet = await findReviewerWalletRepo(slot.reviewerId, tx);

        if (wallet) {
          await creditReviewerWalletEscrowRepo(
            wallet.id,
            verifiedPayment.amount,
            wallet.pendingBalance,
            tx
          );
        } else {
          await createReviewerWalletRepo(
            slot.reviewerId,
            verifiedPayment.amount,
            tx
          );
        }

        await insertWalletEscrowTransactionRepo({
          reviewerId: slot.reviewerId,
          bookingId: booking.id,
          type: "credit_escrow",
          amount: verifiedPayment.amount,
          status: "completed",
          description: `Booking #${booking.id} confirmed: ₹${(verifiedPayment.amount / 100).toFixed(2)} held in escrow`,
          availableAt: dayjs(endTimestamp).add(48, "hour").toDate(),
        }, tx);
      }

      await markSlotBookedRepo(slot.id, tx);

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
    const { eventType, reviewer, bookingPayment } = await findBookingFinalizeDetailsRepo(
      booking.eventTypeId,
      booking.reviewerId,
      booking.id
    );

    if (!eventType || !reviewer) return { meetLink: null };

    const reviewerTimezone = await getEventTimezone(booking.eventTypeId);
    const clientTimezone = (booking as any).formData?.clientTimezone || reviewerTimezone;

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
        timezone: reviewerTimezone,
        attendeeEmails: [
          reviewer.email,
          booking.advisorEmail,
          ...(booking.internEmails ?? []),
        ],
        meetingLink: internalMeetingLink,
      });

      if (meetEvent) {
        await updateBookingMeetingDetailsRepo(
          booking.id,
          internalMeetingLink,
          meetEvent.googleEventId
        );
      }
    } catch (err) {
      console.error(
        `[Booking] Meet event creation failed for booking ${booking.id}:`,
        err
      );
    }

    await updateBookingMeetingDetailsRepo(
      booking.id,
      internalMeetingLink
    );

    const recipients: {
      email: string;
      name: string;
      role: "advisor" | "reviewer" | "intern";
      timezone: string;
    }[] = [
      {
        email: booking.advisorEmail,
        name: booking.advisorName,
        role: "advisor",
        timezone: clientTimezone,
      },
      {
        email: reviewer.email,
        name: reviewer.name,
        role: "reviewer",
        timezone: reviewerTimezone,
      },
      ...(booking.internEmails ?? []).map((email) => ({
        email,
        name: booking.internName,
        role: "intern" as const,
        timezone: clientTimezone,
      })),
    ];

    await Promise.all(
      recipients.map(({ email, name, role, timezone: recipientTz }) => {
        const formattedDate = dayjs(booking.startTime).tz(recipientTz).format("ddd, MMM D");
        const formattedTime = `${dayjs(booking.startTime).tz(recipientTz).format(
          "h:mm A"
        )} – ${dayjs(booking.endTime).tz(recipientTz).format("h:mm A")} (${recipientTz})`;

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
    const { page, limit } = options;
    const { rows, totalCount, counts } = await findMyBookingsRepo(reviewerId, options);

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
      bookings: bookingsWithMeetingLinks,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      counts,
    };
  },

  getBookingById: async (reviewerId: number, bookingId: number) => {
    const row = await findBookingDetailsByIdRepo(reviewerId, bookingId);

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

    const eventType = await findEventTypeNameByIdRepo(booking.eventTypeId);
    const reviewer = await findReviewerContactByIdRepo(reviewerId);

    const updated = await db.transaction(async (tx) => {
      const result = await cancelBookingInDbRepo(bookingId, data.reason, tx);

      await releaseBookingSlot(tx, booking);

      return result;
    });

    if (booking.googleEventId) {
      await calendarService.cancelMeetEvent(reviewerId, booking.googleEventId).catch((err) => {
        console.error(`[Booking] Failed to cancel Calendar event for booking ${bookingId}:`, err);
      });
    }

    if (eventType && reviewer) {
      const reviewerTimezone = await getEventTimezone(booking.eventTypeId);
      const clientTimezone = (booking as any).formData?.clientTimezone || reviewerTimezone;

      const recipients: { email: string; name: string; role: "advisor" | "reviewer" | "intern"; timezone: string }[] = [
        { email: booking.advisorEmail, name: booking.advisorName, role: "advisor", timezone: clientTimezone },
        { email: reviewer.email, name: reviewer.name, role: "reviewer", timezone: reviewerTimezone },
        ...(booking.internEmails ?? []).map((email) => ({
          email,
          name: booking.internName,
          role: "intern" as const,
          timezone: clientTimezone,
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
        recipients.map(({ email, name, role, timezone: recipientTz }) => {
          const formattedDate = dayjs(booking.startTime).tz(recipientTz).format("ddd, MMM D");
          const formattedTime = `${dayjs(booking.startTime).tz(recipientTz).format("h:mm A")} – ${dayjs(booking.endTime).tz(recipientTz).format("h:mm A")} (${recipientTz})`;

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
      const updated = await updateBookingRescheduledRepo(
        bookingId,
        newStartTime,
        newEndTime,
        tx
      );

      if (!updated) {
        throw new AppError("Failed to reschedule booking", 500);
      }

      // Mark the new slot as booked
      await bookSlotWithResetHoldRepo(hold.slotId, tx);

      // Update escrow maturity time to 48 hours after new end time
      await updateEscrowAvailableAtForBookingRepo(
        bookingId,
        dayjs(newEndTime).add(48, "hour").toDate(),
        tx
      );

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

    const updated = await updateBookingRescheduleRequestedRepo(
      bookingId,
      proposedStartTime,
      proposedEndTime,
      data.reason || null,
      rescheduleToken,
      rescheduleTokenExpiresAt
    );

    const eventType = await findEventTypeNameByIdRepo(booking.eventTypeId);
    const reviewer = await findReviewerContactByIdRepo(reviewerId);

    if (eventType && reviewer) {
      const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
      const actionUrl = `${CLIENT_URL}/reschedule-request/${rescheduleToken}`;
      const clientTimezone = (booking as any).formData?.clientTimezone || timezone;
      const currentFormattedDate = dayjs(booking.startTime).tz(clientTimezone).format("ddd, MMM D, YYYY");
      const currentFormattedTime = `${dayjs(booking.startTime).tz(clientTimezone).format("h:mm A")} – ${dayjs(booking.endTime).tz(clientTimezone).format("h:mm A")} (${clientTimezone})`;
      const proposedFormattedDate = dayjs(proposedStartTime).tz(clientTimezone).format("ddd, MMM D, YYYY");
      const proposedFormattedTime = `${dayjs(proposedStartTime).tz(clientTimezone).format("h:mm A")} – ${dayjs(proposedEndTime).tz(clientTimezone).format("h:mm A")} (${clientTimezone})`;

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
    const booking = await findRescheduleRequestByTokenRepo(token);

    if (!booking) {
      throw new AppError("Reschedule request not found or link has expired", 404);
    }

    if (booking.rescheduleTokenExpiresAt && dayjs().isAfter(dayjs(booking.rescheduleTokenExpiresAt))) {
      throw new AppError("This reschedule request link has expired", 410);
    }

    const reviewer = await findRescheduleReviewerRepo(booking.reviewerId);
    const eventType = await findRescheduleEventTypeRepo(booking.eventTypeId);
    const payment = await findPaymentByBookingIdRepo(booking.id);

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

        const updated = await acceptRescheduleRequestRepo(
          booking.id,
          newStartTime,
          newEndTime,
          tx
        );

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
        formData: updatedBooking.formData,
      });

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

        const updated = await acceptRescheduleRequestRepo(
          booking.id,
          newStartTime,
          newEndTime,
          tx
        );

        if (!updated) {
          throw new AppError("Failed to update booking", 500);
        }

        await bookSlotWithResetHoldRepo(hold.slotId, tx);

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
          formData: updatedBooking.formData,
        }
      );

      return updatedBooking;

    } else if (data.action === "decline") {
      const reason = data.declineReason || "Reschedule request declined by advisor";

      const cancelledBooking = await db.transaction(async (tx) => {
        await releaseBookingSlot(tx, booking);

        const updated = await declineRescheduleRequestRepo(
          booking.id,
          reason,
          tx
        );

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
        const reviewerTimezone = await getEventTimezone(booking.eventTypeId);
        const clientTimezone = (booking as any).formData?.clientTimezone || reviewerTimezone;

        const recipients = [
          { email: booking.advisorEmail, name: booking.advisorName, role: "advisor" as const, timezone: clientTimezone },
          { email: reviewer.email, name: reviewer.name, role: "reviewer" as const, timezone: reviewerTimezone },
          ...(booking.internEmails ?? []).map((email) => ({ email, name: booking.internName, role: "intern" as const, timezone: clientTimezone })),
        ];

        await Promise.all(
          recipients.map(({ email, name, role, timezone: recipientTz }) => {
            const formattedDate = dayjs(booking.startTime).tz(recipientTz).format("ddd, MMM D, YYYY");
            const formattedTime = `${dayjs(booking.startTime).tz(recipientTz).format("h:mm A")} – ${dayjs(booking.endTime).tz(recipientTz).format("h:mm A")} (${recipientTz})`;
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
    const existingFeedback = await findFeedbackByBookingIdExistsRepo(bookingId);

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

    const updated = await updateBookingOutcomeRepo(
      bookingId,
      booking.status as NonNullable<typeof bookings.$inferSelect["status"]>,
      outcome
    );

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
      formData?: unknown;
    }
  ) => {
    const eventType = await findEventTypeNameByIdRepo(newBooking.eventTypeId);
    const reviewer = await findReviewerContactByIdRepo(newBooking.reviewerId);

    if (!eventType || !reviewer) return { meetLink: null };

    const reviewerTimezone = await getEventTimezone(newBooking.eventTypeId);
    const clientTimezone = (newBooking as any).formData?.clientTimezone ||
      (oldBooking as any).formData?.clientTimezone ||
      reviewerTimezone;

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
        timezone: reviewerTimezone,
        attendeeEmails: [
          reviewer.email,
          newBooking.advisorEmail,
          ...(newBooking.internEmails ?? []),
        ],
        meetingLink: internalMeetingLink,
      });

      if (meetEvent) {
        await updateBookingMeetingDetailsRepo(
          newBooking.id,
          internalMeetingLink,
          meetEvent.googleEventId
        );
      }
    } catch (err) {
      console.error(`[Booking] Meet event creation failed for rescheduled booking ${newBooking.id}:`, err);
    }

    const recipients: { email: string; name: string; role: "advisor" | "reviewer" | "intern"; timezone: string }[] = [
      { email: newBooking.advisorEmail, name: newBooking.advisorName, role: "advisor", timezone: clientTimezone },
      { email: reviewer.email, name: reviewer.name, role: "reviewer", timezone: reviewerTimezone },
      ...(newBooking.internEmails ?? []).map((email) => ({
        email,
        name: newBooking.internName,
        role: "intern" as const,
        timezone: clientTimezone,
      })),
    ];

    await Promise.all(
      recipients.map(({ email, name, role, timezone: recipientTz }) => {
        const oldFormattedDate = dayjs(oldBooking.startTime).tz(recipientTz).format("ddd, MMM D");
        const oldFormattedTime = `${dayjs(oldBooking.startTime).tz(recipientTz).format("h:mm A")} – ${dayjs(oldBooking.endTime).tz(recipientTz).format("h:mm A")} (${recipientTz})`;
        const newFormattedDate = dayjs(newBooking.startTime).tz(recipientTz).format("ddd, MMM D");
        const newFormattedTime = `${dayjs(newBooking.startTime).tz(recipientTz).format("h:mm A")} – ${dayjs(newBooking.endTime).tz(recipientTz).format("h:mm A")} (${recipientTz})`;

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