import dayjs from "dayjs";
import { eq, and, ne, gte, lt, sql, asc } from "drizzle-orm";
import { db } from "../../config/db.js";
import { bookings } from "../booking/bookings.schema.js";
import { slots } from "../slot/slots.schema.js";
import { eventTypes } from "../eventType/eventTypes.schema.js";
import { reviewers } from "../auth/reviewers.schema.js";
import { feedback, feedbackPendingQuestions, feedbackForms } from "../feedback/feedback.schema.js";
import { questions } from "../questionBank/questions.schema.js";
import { otpService } from "../auth/otp.service.js";
import { slotService } from "../slot/slot.service.js";
import { calendarService } from "../calendar/calendar.service.js";
import { emailService } from "../../services/email.service.js";
import { advisorOtpTemplate } from "../../emails/templates/advisorOtp.js";
import { bookingCancelledTemplate } from "../../emails/templates/bookingCancelled.js";
import { generateAdvisorToken } from "../../core/utils/jwt.js";
import { meetingService } from "../meeting/meeting.service.js";
import { refundService } from "../payment/refund.service.js";
import { bookingService } from "../booking/booking.service.js";
import { walletTransactions } from "../wallet/wallet.schema.js";
import { payments } from "../payment/payments.schema.js";
import { AppError } from "../../core/errors/AppError.js";


export const advisorService = {
  sendOtp: async (email: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const code = await otpService.generateOtp(trimmedEmail, "advisor_access");

    const { subject, html } = advisorOtpTemplate({
      advisorEmail: trimmedEmail,
      otpCode: code,
    });

    await emailService.sendEmail({
      to: trimmedEmail,
      subject,
      html,
    });

    return { message: "Verification code sent to email" };
  },

  verifyOtp: async (email: string, code: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const isValid = await otpService.verifyOtp(trimmedEmail, "advisor_access", code.trim());

    if (!isValid) {
      throw new AppError("Invalid or expired verification code", 400);
    }

    const token = generateAdvisorToken(trimmedEmail);

    return {
      token,
      advisorEmail: trimmedEmail,
    };
  },

  getAdvisorBookings: async (
    advisorEmail: string,
    options: { scope?: "upcoming" | "past" | "cancelled"; search?: string }
  ) => {
    const { scope = "upcoming", search } = options;
    const now = new Date();
    const cleanEmail = advisorEmail.trim().toLowerCase();

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

    const rows = await db
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
      })
      .from(bookings)
      .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
      .innerJoin(reviewers, eq(bookings.reviewerId, reviewers.id))
      .leftJoin(payments, eq(payments.bookingId, bookings.id))
      .leftJoin(feedback, eq(feedback.bookingId, bookings.id))
      .where(and(...scopeConditions))
      .orderBy(orderBy);

    const [upcomingCountRes, pastCountRes, cancelledCountRes] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookings)
        .where(and(eq(bookings.advisorEmail, cleanEmail), gte(bookings.endTime, now), ne(bookings.status, "cancelled"))),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookings)
        .where(and(eq(bookings.advisorEmail, cleanEmail), lt(bookings.endTime, now), ne(bookings.status, "cancelled"))),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookings)
        .where(and(eq(bookings.advisorEmail, cleanEmail), eq(bookings.status, "cancelled"))),
    ]);

    const bookingsWithMeetingLinks = rows.map((booking) => ({
     ...booking,
     meetLink: meetingService.getMeetingLink(booking.id),
    }));

  return {
    bookings: bookingsWithMeetingLinks,
    counts: {
    upcoming: upcomingCountRes[0]?.count ?? 0,
    past: pastCountRes[0]?.count ?? 0,
    cancelled: cancelledCountRes[0]?.count ?? 0,
  },
};
  },

  getAdvisorBookingFeedback: async (advisorEmail: string, bookingId: number) => {
    const cleanEmail = advisorEmail.trim().toLowerCase();

    const [booking] = await db
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

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    const [fb] = await db
      .select()
      .from(feedback)
      .where(eq(feedback.bookingId, bookingId))
      .limit(1);

    if (!fb) {
      throw new AppError("Feedback not submitted for this session yet", 404);
    }

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
      .where(eq(feedbackPendingQuestions.feedbackId, fb.id))
      .orderBy(asc(feedbackPendingQuestions.id));

    let formName: string | null = null;
    if (fb.formId) {
      const [form] = await db
        .select({ name: feedbackForms.name })
        .from(feedbackForms)
        .where(eq(feedbackForms.id, fb.formId))
        .limit(1);
      formName = form?.name ?? null;
    }

    return {
      booking: {
        id: booking.id,
        internName: booking.internName,
        batch: booking.batch,
        weekStage: booking.weekStage,
        reviewerName: booking.reviewerName,
        eventTypeName: booking.eventTypeName,
        startTime: booking.startTime,
        endTime: booking.endTime,
        formName,
      },
      feedback: {
        id: fb.id,
        isNoShow: fb.isNoShow,
        reviewMark: fb.reviewMark,
        taskMark: fb.taskMark,
        comments: fb.comments,
        understandingLevel: fb.understandingLevel,
        customFieldValues: fb.customFieldValues,
        createdAt: fb.createdAt,
        pendingQuestions,
      },
      pendingQuestions,
    };
  },

  cancelAdvisorBooking: async (advisorEmail: string, bookingId: number, data: { reason?: string | undefined }) => {
    const cleanEmail = advisorEmail.trim().toLowerCase();

    const [booking] = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.advisorEmail, cleanEmail)))
      .limit(1);

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    if (booking.status !== "confirmed" && booking.status !== "rescheduled") {
      throw new AppError("Only confirmed or rescheduled bookings can be cancelled", 400);
    }

    const hoursUntilStart = dayjs(booking.startTime).diff(dayjs(), "hour", true);
    if (hoursUntilStart < 3) {
      throw new AppError("This session starts in less than 3 hours and can no longer be changed online", 409);
    }

    const [eventType] = await db
      .select({ name: eventTypes.name })
      .from(eventTypes)
      .where(eq(eventTypes.id, booking.eventTypeId))
      .limit(1);

    const [reviewer] = await db
      .select({ name: reviewers.name, email: reviewers.email })
      .from(reviewers)
      .where(eq(reviewers.id, booking.reviewerId))
      .limit(1);

    const reasonText = data.reason?.trim() || "Cancelled by advisor";

    const updated = await db.transaction(async (tx) => {
      const [result] = await tx
        .update(bookings)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
          cancelledReason: reasonText,
        })
        .where(eq(bookings.id, bookingId))
        .returning();

      const slotDate = dayjs(booking.startTime).format("YYYY-MM-DD");
      const startTime = dayjs(booking.startTime).format("HH:mm:ss");
      const endTime = dayjs(booking.endTime).format("HH:mm:ss");

      await tx
        .update(slots)
        .set({ status: "available", holdToken: null, holdExpiresAt: null, updatedAt: new Date() })
        .where(
          and(
            eq(slots.eventTypeId, booking.eventTypeId),
            eq(slots.slotDate, slotDate),
            eq(slots.startTime, startTime),
            eq(slots.endTime, endTime)
          )
        );

      return result;
    });

    if (booking.googleEventId) {
      await calendarService.cancelMeetEvent(booking.reviewerId, booking.googleEventId).catch((err) => {
        console.error(`[AdvisorBooking] Failed to cancel Calendar event for booking ${bookingId}:`, err);
      });
    }

    // Process automated refund based on 8h/3h policy tiers
    const refundResult = await refundService.processBookingRefund({
      bookingId,
      initiatedBy: "advisor",
      reason: reasonText,
    }).catch((err) => {
      console.error(`[AdvisorBooking] Automated refund failed on advisor cancel for booking ${bookingId}:`, err);
      return null;
    });

    let refundStatusText: string | null = null;
    if (refundResult) {
      if (refundResult.refundAmount > 0 && refundResult.cancellationFee > 0) {
        refundStatusText = `Partial refund of ₹${(refundResult.refundAmount / 100).toFixed(2)} initiated via Razorpay (₹${(refundResult.cancellationFee / 100).toFixed(2)} cancellation fee retained). Credited within 5–7 business days.`;
      } else if (refundResult.refundAmount > 0) {
        refundStatusText = `Full 100% refund of ₹${(refundResult.refundAmount / 100).toFixed(2)} initiated via Razorpay. Credited within 5–7 business days.`;
      } else if (refundResult.cancellationFee > 0) {
        refundStatusText = `Non-refundable cancellation (session was previously rescheduled). Fee transferred to reviewer as compensation.`;
      }
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

      await Promise.all(
        recipients.map(({ email, name, role }) => {
          const { subject, html } = bookingCancelledTemplate({
            recipientName: name,
            recipientRole: role,
            eventTypeName: eventType.name,
            reviewerName: reviewer.name,
            advisorName: booking.advisorName,
            formattedDate,
            formattedTime,
            reason: reasonText,
            refundStatusText,
          });
          return emailService.sendEmail({ to: email, subject, html }).catch((err) => {
            console.error(`[AdvisorBooking] Failed to send cancellation email to ${email}:`, err);
          });
        })
      );
    }

    return updated;
  },

  rescheduleAdvisorBooking: async (
    advisorEmail: string,
    bookingId: number,
    data: { date: string; startTime: string; endTime: string; reason?: string | undefined }
  ) => {
    const cleanEmail = advisorEmail.trim().toLowerCase();

    const [booking] = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.advisorEmail, cleanEmail)))
      .limit(1);

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    if (booking.status !== "confirmed" && booking.status !== "rescheduled") {
      throw new AppError("Only confirmed or rescheduled bookings can be rescheduled", 400);
    }

    if (booking.rescheduleCount >= 1) {
      throw new AppError("This booking has already been rescheduled once and cannot be rescheduled again", 400);
    }

    const hoursUntilStart = dayjs(booking.startTime).diff(dayjs(), "hour", true);
    if (hoursUntilStart < 3) {
      throw new AppError("This session starts in less than 3 hours and can no longer be changed online", 409);
    }

    const hold = await slotService.holdSlot({
      eventTypeId: booking.eventTypeId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
    });

    const newStartTime = dayjs(`${data.date}T${data.startTime}`).toDate();
    const newEndTime = dayjs(`${data.date}T${data.endTime}`).toDate();

    const updatedBooking = await db.transaction(async (tx) => {
      const oldSlotDate = dayjs(booking.startTime).format("YYYY-MM-DD");
      const oldStartTime = dayjs(booking.startTime).format("HH:mm:ss");
      const oldEndTime = dayjs(booking.endTime).format("HH:mm:ss");

      await tx
        .update(slots)
        .set({ status: "available", holdToken: null, holdExpiresAt: null, updatedAt: new Date() })
        .where(
          and(
            eq(slots.eventTypeId, booking.eventTypeId),
            eq(slots.slotDate, oldSlotDate),
            eq(slots.startTime, oldStartTime),
            eq(slots.endTime, oldEndTime)
          )
        );

      const [updated] = await tx
        .update(bookings)
        .set({
          startTime: newStartTime,
          endTime: newEndTime,
          status: "rescheduled",
          rescheduleCount: booking.rescheduleCount + 1,
          meetLink: null,
          googleEventId: null,
        })
        .where(eq(bookings.id, bookingId))
        .returning();

      if (!updated) {
        throw new AppError("Failed to reschedule booking", 500);
      }

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
      await calendarService.cancelMeetEvent(booking.reviewerId, booking.googleEventId).catch((err) => {
        console.error(`[AdvisorBooking] Failed to cancel old Calendar event for booking ${bookingId}:`, err);
      });
    }

    // Finalize reschedule: regenerate Google Meet / internal link and send confirmation emails
    await bookingService.finalizeReschedule(
      { startTime: booking.startTime, endTime: booking.endTime },
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
  },
};

