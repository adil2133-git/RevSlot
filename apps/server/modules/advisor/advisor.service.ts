import dayjs from "dayjs";
import { db } from "../../config/db.js";
import { otpService } from "../auth/otp.service.js";
import { slotService } from "../slot/slot.service.js";
import { calendarService } from "../calendar/calendar.service.js";
import { emailService } from "../../services/email.service.js";
import { advisorOtpTemplate, advisorOtpTemplateData } from "../../emails/templates/advisorOtp.js";
import { bookingCancelledTemplate, bookingCancelledTemplateData } from "../../emails/templates/bookingCancelled.js";
import { generateAdvisorToken } from "../../core/utils/jwt.js";
import { meetingService } from "../meeting/meeting.service.js";
import { refundService } from "../payment/refund.service.js";
import { bookingService } from "../booking/booking.service.js";
import { notificationService } from "../notification/notification.service.js";
import { AppError } from "../../core/errors/AppError.js";
import {
  findAdvisorBookingsRepo,
  countAdvisorBookingsByScopeRepo,
  findAdvisorBookingFeedbackHeaderRepo,
  findFeedbackByBookingIdRepo,
  findFeedbackPendingQuestionsByFeedbackIdRepo,
  findFeedbackFormNameByIdRepo,
  findAdvisorBookingByIdAndEmailRepo,
  findEventTypeNameByIdRepo,
  findReviewerContactByIdRepo,
  cancelBookingWithReasonRepo,
  releaseSlotByDateTimeRepo,
  rescheduleBookingRepo,
  bookSlotByIdRepo,
  updateEscrowAvailableAtRepo,
} from "./advisor.repository.js";

export const advisorService = {
  sendOtp: async (email: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const code = await otpService.generateOtp(trimmedEmail, "advisor_access");

    const { html: fallbackHtml } = advisorOtpTemplate({
      advisorEmail: trimmedEmail,
      otpCode: code,
    });
    const { templateId, subject, variables } = advisorOtpTemplateData({
      advisorEmail: trimmedEmail,
      otpCode: code,
    });

    await emailService.sendTemplateEmail({
      to: trimmedEmail,
      templateId,
      subject,
      variables,
      fallbackHtml,
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
    const cleanEmail = advisorEmail.trim().toLowerCase();

    const [rows, counts] = await Promise.all([
      findAdvisorBookingsRepo(cleanEmail, { scope, search }),
      countAdvisorBookingsByScopeRepo(cleanEmail),
    ]);

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
      counts,
    };
  },

  getAdvisorBookingFeedback: async (advisorEmail: string, bookingId: number) => {
    const cleanEmail = advisorEmail.trim().toLowerCase();

    const booking = await findAdvisorBookingFeedbackHeaderRepo(cleanEmail, bookingId);

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    const fb = await findFeedbackByBookingIdRepo(bookingId);

    if (!fb) {
      throw new AppError("Feedback not submitted for this session yet", 404);
    }

    const pendingQuestions = await findFeedbackPendingQuestionsByFeedbackIdRepo(fb.id);

    let formName: string | null = null;
    if (fb.formId) {
      formName = await findFeedbackFormNameByIdRepo(fb.formId);
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

    const booking = await findAdvisorBookingByIdAndEmailRepo(cleanEmail, bookingId);

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

    const eventType = await findEventTypeNameByIdRepo(booking.eventTypeId);
    const reviewer = await findReviewerContactByIdRepo(booking.reviewerId);

    const reasonText = data.reason?.trim() || "Cancelled by advisor";

    const updated = await db.transaction(async (tx) => {
      const result = await cancelBookingWithReasonRepo(bookingId, reasonText, tx);

      const slotDate = dayjs(booking.startTime).format("YYYY-MM-DD");
      const startTime = dayjs(booking.startTime).format("HH:mm:ss");
      const endTime = dayjs(booking.endTime).format("HH:mm:ss");

      await releaseSlotByDateTimeRepo(
        booking.eventTypeId,
        slotDate,
        startTime,
        endTime,
        tx
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
          const { html: fallbackHtml } = bookingCancelledTemplate({
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
          const { templateId, subject, variables } = bookingCancelledTemplateData({
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
          return emailService.sendTemplateEmail({ to: email, templateId, subject, variables, fallbackHtml }).catch((err) => {
            console.error(`[AdvisorBooking] Failed to send cancellation email to ${email}:`, err);
          });
        })
      );

      await notificationService.createNotification({
        reviewerId: booking.reviewerId,
        type: "booking_cancelled",
        title: "Booking cancelled by advisor",
        message: `${booking.advisorName} cancelled their session for ${dayjs(booking.startTime).format("ddd, MMM D")}`,
        bookingId: booking.id,
      });
    }

    return updated;
  },

  rescheduleAdvisorBooking: async (
    advisorEmail: string,
    bookingId: number,
    data: { date: string; startTime: string; endTime: string; reason?: string | undefined }
  ) => {
    const cleanEmail = advisorEmail.trim().toLowerCase();

    const booking = await findAdvisorBookingByIdAndEmailRepo(cleanEmail, bookingId);

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

      await releaseSlotByDateTimeRepo(
        booking.eventTypeId,
        oldSlotDate,
        oldStartTime,
        oldEndTime,
        tx
      );

      const updated = await rescheduleBookingRepo(
        bookingId,
        newStartTime,
        newEndTime,
        booking.rescheduleCount + 1,
        tx
      );

      if (!updated) {
        throw new AppError("Failed to reschedule booking", 500);
      }

      await bookSlotByIdRepo(hold.slotId, tx);

      // Update escrow maturity time to 48 hours after new end time
      await updateEscrowAvailableAtRepo(
        bookingId,
        dayjs(newEndTime).add(48, "hour").toDate(),
        tx
      );

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

    await notificationService.createNotification({
      reviewerId: updatedBooking.reviewerId,
      type: "booking_rescheduled",
      title: "Booking rescheduled by advisor",
      message: `${updatedBooking.advisorName} rescheduled their session to ${dayjs(updatedBooking.startTime).format("ddd, MMM D, h:mm A")}`,
      bookingId: updatedBooking.id,
    });

    return updatedBooking;
  },
};