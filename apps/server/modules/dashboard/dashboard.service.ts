import { eq, and, gte, lte, desc, count, inArray, sql } from "drizzle-orm";
import { db } from "../../config/db.js";
import { reviewers } from "../auth/reviewers.model.js";
import { bookings } from "../booking/bookings.schema.js";
import { eventTypes } from "../eventType/eventTypes.model.js";
import { vacationBlocks } from "../vacation/vacation.schema.js";
import { availabilityTemplates } from "../availability/models/availabilityTemplates.schema.js";
import { templateTimeBlocks } from "../availability/models/templateTimeBlocks.schema.js";
import { questionBanks } from "../questionBank/questionBanks.model.js";
import { questions } from "../questionBank/questions.model.js";
import { AppError } from "../../core/errors/AppError.js";
import type { GetDashboardSummaryQueryInput } from "./dashboard.validation.js";

export const dashboardService = {
  getReviewerSummary: async (reviewerId: number, query: GetDashboardSummaryQueryInput) => {
    // 1. Get reviewer profile info
    const [reviewer] = await db
      .select({
        id: reviewers.id,
        name: reviewers.name,
        username: reviewers.username,
        email: reviewers.email,
        avatarUrl: reviewers.avatarUrl,
        bio: reviewers.bio,
      })
      .from(reviewers)
      .where(and(eq(reviewers.id, reviewerId), eq(reviewers.isActive, true)))
      .limit(1);

    if (!reviewer) {
      throw new AppError("Reviewer not found", 404);
    }

    const now = new Date();
    const targetDate = query.date ? new Date(query.date) : new Date();

    const startOfToday = new Date(targetDate);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(targetDate);
    endOfToday.setHours(23, 59, 59, 999);

    // 2. Compute Metric 1: Upcoming Reviews count
    let timeframeStart = startOfToday;
    let timeframeEnd: Date | null = null;

    if (query.timeframe === 'week') {
      timeframeEnd = new Date(startOfToday);
      timeframeEnd.setDate(timeframeEnd.getDate() + 7);
    } else if (query.timeframe === 'month') {
      timeframeEnd = new Date(startOfToday);
      timeframeEnd.setMonth(timeframeEnd.getMonth() + 1);
    } else if (query.timeframe === 'today') {
      timeframeEnd = endOfToday;
    }

    const upcomingConditions = [
      eq(bookings.reviewerId, reviewerId),
      eq(bookings.status, 'confirmed'),
      gte(bookings.startTime, timeframeStart),
    ];
    if (timeframeEnd) {
      upcomingConditions.push(lte(bookings.startTime, timeframeEnd));
    }

    const upcomingRes = await db
      .select({ upcomingCount: count(bookings.id) })
      .from(bookings)
      .where(and(...upcomingConditions));
    const upcomingCount = upcomingRes[0]?.upcomingCount ?? 0;

    // 3. Compute Metric 2: Completed Reviews count
    const completedRes = await db
      .select({ completedCount: count(bookings.id) })
      .from(bookings)
      .where(
        and(
          eq(bookings.reviewerId, reviewerId),
          inArray(bookings.status, ['completed', 'confirmed']),
          lte(bookings.endTime, now)
        )
      );
    const completedCount = completedRes[0]?.completedCount ?? 0;

    // 4. Compute Metric 3: Active Event Types Count
    const activeEventTypesRes = await db
      .select({ activeEventTypesCount: count(eventTypes.id) })
      .from(eventTypes)
      .where(and(eq(eventTypes.reviewerId, reviewerId), eq(eventTypes.isActive, true)));
    const activeEventTypesCount = activeEventTypesRes[0]?.activeEventTypesCount ?? 0;

    // 5. Compute Metric 4: Total Review Hours Logged
    const completedOrPastBookings = await db
      .select({
        startTime: bookings.startTime,
        endTime: bookings.endTime,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.reviewerId, reviewerId),
          inArray(bookings.status, ['completed', 'confirmed']),
          lte(bookings.endTime, now)
        )
      );

    let totalMinutes = 0;
    for (const b of completedOrPastBookings) {
      const duration = (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 60000;
      if (duration > 0) totalMinutes += duration;
    }
    const reviewHoursLogged = Number((totalMinutes / 60).toFixed(1));

    // 6. Banners & Alerts
    // Alert A: Imminent Session starting within 30 minutes
    const thirtyMinsLater = new Date(now.getTime() + 30 * 60 * 1000);
    const [imminentBooking] = await db
      .select({
        id: bookings.id,
        internName: bookings.internName,
        batch: bookings.batch,
        weekStage: bookings.weekStage,
        startTime: bookings.startTime,
        eventTypeName: eventTypes.name,
      })
      .from(bookings)
      .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
      .where(
        and(
          eq(bookings.reviewerId, reviewerId),
          eq(bookings.status, 'confirmed'),
          gte(bookings.startTime, now),
          lte(bookings.startTime, thirtyMinsLater)
        )
      )
      .orderBy(bookings.startTime)
      .limit(1);

    let imminentAlert = null;
    if (imminentBooking) {
      const minsRemaining = Math.max(1, Math.round((new Date(imminentBooking.startTime).getTime() - now.getTime()) / 60000));
      imminentAlert = {
        id: imminentBooking.id,
        internName: imminentBooking.internName,
        batch: imminentBooking.batch,
        weekStage: imminentBooking.weekStage,
        eventTypeName: imminentBooking.eventTypeName,
        startsInMinutes: minsRemaining,
        message: `Review session with Intern ${imminentBooking.internName} (${imminentBooking.batch} - ${imminentBooking.weekStage}) starts in ${minsRemaining} minutes!`,
      };
    }

    // Alert B: Pending Evaluations from past sessions
    const pendingEvalBookings = await db
      .select({
        id: bookings.id,
        internName: bookings.internName,
        weekStage: bookings.weekStage,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.reviewerId, reviewerId),
          eq(bookings.status, 'confirmed'),
          lte(bookings.endTime, now)
        )
      );

    let pendingEvalAlert = null;
    if (pendingEvalBookings.length > 0) {
      pendingEvalAlert = {
        count: pendingEvalBookings.length,
        message: `Action Required: You have ${pendingEvalBookings.length} past sessions with pending evaluation scores/feedback.`,
        actionLabel: "Complete Evaluation",
      };
    }

    // Alert C: Vacation notice alert
    const dateStrToday = startOfToday.toISOString().split('T')[0];
    const [activeVacation] = await db
      .select()
      .from(vacationBlocks)
      .where(
        and(
          eq(vacationBlocks.reviewerId, reviewerId),
          eq(vacationBlocks.isActive, true),
          sql`${vacationBlocks.startDate} <= ${dateStrToday}`,
          sql`${vacationBlocks.endDate} >= ${dateStrToday}`
        )
      )
      .limit(1);

    let vacationAlert = null;
    if (activeVacation) {
      const isSingleDay = activeVacation.startDate === activeVacation.endDate;
      vacationAlert = {
        id: activeVacation.id,
        startDate: activeVacation.startDate,
        endDate: activeVacation.endDate,
        reason: activeVacation.reason,
        message: isSingleDay
          ? `Notice: Vacation active for today (${activeVacation.startDate}). All booking links are temporarily paused.`
          : `Notice: Vacation active from ${activeVacation.startDate} to ${activeVacation.endDate}. All booking links are temporarily paused.`,
      };
    }

    // 7. Today's Schedule
    const todaysSchedule = await db
      .select({
        id: bookings.id,
        eventTypeId: bookings.eventTypeId,
        eventTypeName: eventTypes.name,
        internName: bookings.internName,
        batch: bookings.batch,
        advisorName: bookings.advisorName,
        advisorEmail: bookings.advisorEmail,
        weekStage: bookings.weekStage,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
        meetLink: bookings.meetLink,
      })
      .from(bookings)
      .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
      .where(
        and(
          eq(bookings.reviewerId, reviewerId),
          gte(bookings.startTime, startOfToday),
          lte(bookings.startTime, endOfToday)
        )
      )
      .orderBy(bookings.startTime);

    // 8. Dynamic Activity Feed from bookings table
    const recentBookings = await db
      .select({
        id: bookings.id,
        internName: bookings.internName,
        status: bookings.status,
        rescheduledFromBookingId: bookings.rescheduledFromBookingId,
        eventTypeName: eventTypes.name,
        createdAt: bookings.createdAt,
        cancelledAt: bookings.cancelledAt,
        cancelledReason: bookings.cancelledReason,
      })
      .from(bookings)
      .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
      .where(eq(bookings.reviewerId, reviewerId))
      .orderBy(desc(bookings.createdAt))
      .limit(10);

    const activityFeed = recentBookings.map((b) => {
      let type: 'new_booking' | 'rescheduled' | 'cancellation' = 'new_booking';
      let title = '';
      let timestamp = b.createdAt;

      if (b.status === 'cancelled') {
        type = 'cancellation';
        title = `Cancellation: ${b.internName} cancelled '${b.eventTypeName}'`;
        timestamp = b.cancelledAt || b.createdAt;
      } else if (b.rescheduledFromBookingId !== null || b.status === 'rescheduled') {
        type = 'rescheduled';
        title = `Rescheduled: ${b.internName} moved '${b.eventTypeName}'`;
      } else {
        type = 'new_booking';
        title = `New Booking: ${b.internName} scheduled '${b.eventTypeName}'`;
      }

      return {
        id: b.id,
        type,
        title,
        timestamp,
      };
    });

    // 9. Quick Share Event Types
    const quickShareEventTypes = await db
      .select({
        id: eventTypes.id,
        name: eventTypes.name,
        slug: eventTypes.slug,
        durationMinutes: eventTypes.durationMinutes,
        bookingUrl: sql<string>`'/' || ${reviewer.username} || '/' || ${eventTypes.slug}`,
      })
      .from(eventTypes)
      .where(and(eq(eventTypes.reviewerId, reviewerId), eq(eventTypes.isActive, true), eq(eventTypes.isPublic, true)))
      .orderBy(desc(eventTypes.createdAt));

    // 10. Availability Overview
    const [defaultTemplate] = await db
      .select({
        id: availabilityTemplates.id,
        name: availabilityTemplates.name,
        timezone: availabilityTemplates.timezone,
      })
      .from(availabilityTemplates)
      .where(and(eq(availabilityTemplates.reviewerId, reviewerId), eq(availabilityTemplates.isDefault, true)))
      .limit(1);

    let timeBlocks: Array<{ dayOfWeek: number; startTime: string; endTime: string }> = [];
    if (defaultTemplate) {
      timeBlocks = await db
        .select({
          dayOfWeek: templateTimeBlocks.dayOfWeek,
          startTime: templateTimeBlocks.startTime,
          endTime: templateTimeBlocks.endTime,
        })
        .from(templateTimeBlocks)
        .where(eq(templateTimeBlocks.templateId, defaultTemplate.id))
        .orderBy(templateTimeBlocks.dayOfWeek);
    }

    return {
      reviewer: {
        id: reviewer.id,
        name: reviewer.name,
        username: reviewer.username,
        email: reviewer.email,
        avatarUrl: reviewer.avatarUrl,
        bio: reviewer.bio,
      },
      metrics: {
        upcomingReviews: upcomingCount,
        completedReviews: completedCount,
        activeEventTypes: activeEventTypesCount,
        reviewHoursLogged,
      },
      alerts: {
        imminentSession: imminentAlert,
        pendingEvaluations: pendingEvalAlert,
        vacationNotice: vacationAlert,
      },
      todaysSchedule,
      activityFeed,
      quickShareEventTypes,
      availabilityOverview: {
        templateName: defaultTemplate?.name || "Default Schedule",
        timezone: defaultTemplate?.timezone || "UTC",
        timeBlocks,
        vacationActive: !!activeVacation,
      },
    };
  },

  getBookingReferenceQuestions: async (reviewerId: number, bookingId: number) => {
    // 1. Get booking and check reviewer ownership
    const [booking] = await db
      .select({
        id: bookings.id,
        eventTypeId: bookings.eventTypeId,
        internName: bookings.internName,
        weekStage: bookings.weekStage,
        eventTypeName: eventTypes.name,
      })
      .from(bookings)
      .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
      .where(and(eq(bookings.id, bookingId), eq(bookings.reviewerId, reviewerId)))
      .limit(1);

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    // 2. Retrieve reviewer's question bank
    const [bank] = await db
      .select({
        id: questionBanks.id,
        name: questionBanks.name,
        description: questionBanks.description,
      })
      .from(questionBanks)
      .where(eq(questionBanks.reviewerId, reviewerId))
      .orderBy(questionBanks.id)
      .limit(1);

    let bankQuestions: Array<{
      id: number;
      questionText: string;
      description: string | null;
      displayOrder: number | null;
    }> = [];

    if (bank) {
      bankQuestions = await db
        .select({
          id: questions.id,
          questionText: questions.questionText,
          description: questions.description,
          displayOrder: questions.displayOrder,
        })
        .from(questions)
        .where(eq(questions.bankId, bank.id))
        .orderBy(questions.displayOrder, questions.id);
    }

    return {
      booking: {
        id: booking.id,
        internName: booking.internName,
        weekStage: booking.weekStage,
        eventTypeName: booking.eventTypeName,
      },
      questionBank: bank ? {
        id: bank.id,
        name: bank.name,
        description: bank.description,
        questions: bankQuestions,
      } : null,
    };
  },
};
