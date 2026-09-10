import { eq, and, ne, gte, lt, sql } from "drizzle-orm";
import { db } from "../../config/db.js";
import { bookings } from "../booking/bookings.schema.js";
import { eventTypes } from "../eventType/eventTypes.schema.js";
import { reviewers } from "../auth/reviewers.schema.js";
import { feedback } from "../feedback/feedback.schema.js";
import { otpService } from "../auth/otp.service.js";
import { emailService } from "../../services/email.service.js";
import { advisorOtpTemplate } from "../../emails/templates/advisorOtp.js";
import { generateAdvisorToken } from "../../core/utils/jwt.js";
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
      scopeConditions.push(gte(bookings.startTime, now));
      scopeConditions.push(ne(bookings.status, "cancelled"));
    } else if (scope === "past") {
      scopeConditions.push(lt(bookings.startTime, now));
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
        eventTypeName: eventTypes.name,
        reviewerName: reviewers.name,
        timezone: sql<string>`'IST'`,
        hasFeedback: sql<boolean>`${feedback.id} is not null`,
      })
      .from(bookings)
      .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
      .innerJoin(reviewers, eq(bookings.reviewerId, reviewers.id))
      .leftJoin(feedback, eq(feedback.bookingId, bookings.id))
      .where(and(...scopeConditions))
      .orderBy(orderBy);

    const [upcomingCountRes, pastCountRes, cancelledCountRes] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookings)
        .where(and(eq(bookings.advisorEmail, cleanEmail), gte(bookings.startTime, now), ne(bookings.status, "cancelled"))),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookings)
        .where(and(eq(bookings.advisorEmail, cleanEmail), lt(bookings.startTime, now), ne(bookings.status, "cancelled"))),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookings)
        .where(and(eq(bookings.advisorEmail, cleanEmail), eq(bookings.status, "cancelled"))),
    ]);

    return {
      bookings: rows,
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
      },
    };
  },
};
