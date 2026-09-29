import { AppError } from "../../core/errors/AppError.js";
import type { GetDashboardSummaryQueryInput } from "./dashboard.validation.js";
import {
  findActiveReviewerByIdRepo,
  countUpcomingReviewsRepo,
  countCompletedReviewsRepo,
  countActiveEventTypesRepo,
  findCompletedOrPastBookingDurationsRepo,
  findImminentBookingRepo,
  findPendingEvalBookingsRepo,
  findActiveVacationBlockForDateRepo,
  findTodaysScheduleRepo,
  findNextReviewRepo,
  findRecentBookingsForActivityFeedRepo,
  findQuickShareEventTypesRepo,
  findDefaultAvailabilityTemplateWithBlocksRepo,
  findBookingForReferenceQuestionsRepo,
  findReviewerQuestionBanksWithQuestionsRepo,
  findFeedbackFormWithQuestionsRepo,
} from "./dashboard.repository.js";

export const dashboardService = {
  getReviewerSummary: async (reviewerId: number, query: GetDashboardSummaryQueryInput) => {
    // 1. Get reviewer profile info
    const reviewer = await findActiveReviewerByIdRepo(reviewerId);

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
    const timeframeStart = startOfToday;
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

    const upcomingCount = await countUpcomingReviewsRepo(
      reviewerId,
      timeframeStart,
      timeframeEnd
    );

    // 3. Compute Metric 2: Completed Reviews count
    const completedCount = await countCompletedReviewsRepo(reviewerId, now);

    // 4. Compute Metric 3: Active Event Types Count
    const activeEventTypesCount = await countActiveEventTypesRepo(reviewerId);

    // 5. Compute Metric 4: Total Review Hours Logged
    const completedOrPastBookings = await findCompletedOrPastBookingDurationsRepo(
      reviewerId,
      now
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
    const imminentBooking = await findImminentBookingRepo(
      reviewerId,
      now,
      thirtyMinsLater
    );

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
    const pendingEvalBookings = await findPendingEvalBookingsRepo(reviewerId, now);

    let pendingEvalAlert = null;
    if (pendingEvalBookings.length > 0) {
      pendingEvalAlert = {
        count: pendingEvalBookings.length,
        bookingId: pendingEvalBookings[0]?.id,
        message: `Action Required: You have ${pendingEvalBookings.length} past session(s) with pending evaluation scores/feedback.`,
        actionLabel: "Complete Evaluation",
      };
    }

    // Alert C: Vacation notice alert
    const dateStrToday = startOfToday.toISOString().split('T')[0]!;
    const activeVacation = await findActiveVacationBlockForDateRepo(reviewerId, dateStrToday);

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
    const todaysSchedule = await findTodaysScheduleRepo(
      reviewerId,
      startOfToday,
      endOfToday
    );

    // 8. Next Review — nearest active booking from now
    const nextReview = await findNextReviewRepo(reviewerId, now);

    // 9. Dynamic Activity Feed from bookings table
    const recentBookings = await findRecentBookingsForActivityFeedRepo(reviewerId, 10);

    const activityFeed = recentBookings.map((b) => {
      let type: 'new_booking' | 'rescheduled' | 'cancellation';
      let title: string;
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

    // 10. Quick Share Event Types
    const quickShareEventTypes = await findQuickShareEventTypesRepo(
      reviewerId,
      reviewer.username
    );

    // 11. Availability Overview
    const { defaultTemplate, timeBlocks } = await findDefaultAvailabilityTemplateWithBlocksRepo(
      reviewerId
    );

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
      nextReview: nextReview ?? null,
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

  getBookingReferenceQuestions: async (reviewerId: number, bookingId: number, formId?: number) => {
    // 1. Get booking and check reviewer ownership
    const booking = await findBookingForReferenceQuestionsRepo(reviewerId, bookingId);

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    // 2. Retrieve reviewer's question bank
    const questionBanksWithQuestions = await findReviewerQuestionBanksWithQuestionsRepo(reviewerId);

    let formQuestions: Array<{ id: number; questionText: string; description: string | null; displayOrder: number | null }> = [];
    let formName: string | null = null;

    if (formId) {
      const formData = await findFeedbackFormWithQuestionsRepo(reviewerId, formId);
      if (formData) {
        formName = formData.formName;
        formQuestions = formData.questions;
      }
    }

    return {
      booking: {
        id: booking.id,
        internName: booking.internName,
        weekStage: booking.weekStage,
        eventTypeName: booking.eventTypeName,
      },
      questionBanks: questionBanksWithQuestions,
      formChecklist: formId ? { formId, formName, questions: formQuestions } : null,
    };
  },
};
