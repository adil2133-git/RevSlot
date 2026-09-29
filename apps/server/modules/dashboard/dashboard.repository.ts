import { eq, and, gte, lte, desc, count, inArray, sql } from "drizzle-orm";
import { db } from "../../config/db.js";
import { reviewers } from "../auth/reviewers.schema.js";
import { bookings } from "../booking/bookings.schema.js";
import { eventTypes } from "../eventType/eventTypes.schema.js";
import { vacationBlocks } from "../vacation/vacation.schema.js";
import { availabilityTemplates } from "../availability/schema/availabilityTemplates.schema.js";
import { templateTimeBlocks } from "../availability/schema/templateTimeBlocks.schema.js";
import { questionBanks } from "../questionBank/questionBanks.schema.js";
import { questions } from "../questionBank/questions.schema.js";
import { feedbackForms, feedbackFormQuestions, feedback } from "../feedback/feedback.schema.js";

type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export const findActiveReviewerByIdRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [reviewer] = await tx
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

  return reviewer ?? null;
};

export const countUpcomingReviewsRepo = async (
  reviewerId: number,
  timeframeStart: Date,
  timeframeEnd: Date | null,
  tx: DbOrTx = db
) => {
  const upcomingConditions = [
    eq(bookings.reviewerId, reviewerId),
    eq(bookings.status, "confirmed"),
    gte(bookings.startTime, timeframeStart),
  ];
  if (timeframeEnd) {
    upcomingConditions.push(lte(bookings.startTime, timeframeEnd));
  }

  const upcomingRes = await tx
    .select({ upcomingCount: count(bookings.id) })
    .from(bookings)
    .where(and(...upcomingConditions));

  return upcomingRes[0]?.upcomingCount ?? 0;
};

export const countCompletedReviewsRepo = async (
  reviewerId: number,
  now: Date,
  tx: DbOrTx = db
) => {
  const completedRes = await tx
    .select({ completedCount: count(bookings.id) })
    .from(bookings)
    .where(
      and(
        eq(bookings.reviewerId, reviewerId),
        inArray(bookings.status, ["completed", "confirmed"]),
        lte(bookings.endTime, now)
      )
    );

  return completedRes[0]?.completedCount ?? 0;
};

export const countActiveEventTypesRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const activeEventTypesRes = await tx
    .select({ activeEventTypesCount: count(eventTypes.id) })
    .from(eventTypes)
    .where(and(eq(eventTypes.reviewerId, reviewerId), eq(eventTypes.isActive, true)));

  return activeEventTypesRes[0]?.activeEventTypesCount ?? 0;
};

export const findCompletedOrPastBookingDurationsRepo = async (
  reviewerId: number,
  now: Date,
  tx: DbOrTx = db
) => {
  return tx
    .select({
      startTime: bookings.startTime,
      endTime: bookings.endTime,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.reviewerId, reviewerId),
        inArray(bookings.status, ["completed", "confirmed"]),
        lte(bookings.endTime, now)
      )
    );
};

export const findImminentBookingRepo = async (
  reviewerId: number,
  now: Date,
  thirtyMinsLater: Date,
  tx: DbOrTx = db
) => {
  const [imminentBooking] = await tx
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
        eq(bookings.status, "confirmed"),
        gte(bookings.startTime, now),
        lte(bookings.startTime, thirtyMinsLater)
      )
    )
    .orderBy(bookings.startTime)
    .limit(1);

  return imminentBooking ?? null;
};

export const findPendingEvalBookingsRepo = async (
  reviewerId: number,
  now: Date,
  tx: DbOrTx = db
) => {
  return tx
    .select({
      id: bookings.id,
      internName: bookings.internName,
      weekStage: bookings.weekStage,
      status: bookings.status,
    })
    .from(bookings)
    .leftJoin(feedback, eq(feedback.bookingId, bookings.id))
    .where(
      and(
        eq(bookings.reviewerId, reviewerId),
        lte(bookings.endTime, now),
        sql`(${bookings.status} = 'confirmed' OR (${bookings.status} = 'completed' AND ${feedback.id} IS NULL))`
      )
    )
    .orderBy(desc(bookings.endTime));
};

export const findActiveVacationBlockForDateRepo = async (
  reviewerId: number,
  dateStr: string,
  tx: DbOrTx = db
) => {
  const [activeVacation] = await tx
    .select()
    .from(vacationBlocks)
    .where(
      and(
        eq(vacationBlocks.reviewerId, reviewerId),
        eq(vacationBlocks.isActive, true),
        sql`${vacationBlocks.startDate} <= ${dateStr}`,
        sql`${vacationBlocks.endDate} >= ${dateStr}`
      )
    )
    .limit(1);

  return activeVacation ?? null;
};

export const findTodaysScheduleRepo = async (
  reviewerId: number,
  startOfToday: Date,
  endOfToday: Date,
  tx: DbOrTx = db
) => {
  return tx
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
};

export const findNextReviewRepo = async (
  reviewerId: number,
  now: Date,
  tx: DbOrTx = db
) => {
  const [nextReview] = await tx
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
        inArray(bookings.status, ["confirmed", "rescheduled"]),
        sql`${bookings.endTime} > ${now}`
      )
    )
    .orderBy(bookings.startTime)
    .limit(1);

  return nextReview ?? null;
};

export const findRecentBookingsForActivityFeedRepo = async (
  reviewerId: number,
  limit: number = 10,
  tx: DbOrTx = db
) => {
  return tx
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
    .limit(limit);
};

export const findQuickShareEventTypesRepo = async (
  reviewerId: number,
  username: string,
  tx: DbOrTx = db
) => {
  return tx
    .select({
      id: eventTypes.id,
      name: eventTypes.name,
      slug: eventTypes.slug,
      durationMinutes: eventTypes.durationMinutes,
      bookingUrl: sql<string>`'/' || ${username} || '/' || ${eventTypes.slug}`,
    })
    .from(eventTypes)
    .where(and(eq(eventTypes.reviewerId, reviewerId), eq(eventTypes.isActive, true), eq(eventTypes.isPublic, true)))
    .orderBy(desc(eventTypes.createdAt));
};

export const findDefaultAvailabilityTemplateWithBlocksRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [defaultTemplate] = await tx
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
    timeBlocks = await tx
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
    defaultTemplate: defaultTemplate ?? null,
    timeBlocks,
  };
};

export const findBookingForReferenceQuestionsRepo = async (
  reviewerId: number,
  bookingId: number,
  tx: DbOrTx = db
) => {
  const [booking] = await tx
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

  return booking ?? null;
};

export const findReviewerQuestionBanksWithQuestionsRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const banks = await tx
    .select({
      id: questionBanks.id,
      name: questionBanks.name,
      description: questionBanks.description,
    })
    .from(questionBanks)
    .where(eq(questionBanks.reviewerId, reviewerId))
    .orderBy(questionBanks.id);

  if (!banks.length) {
    return [];
  }

  const allQuestions = await tx
    .select({
      id: questions.id,
      bankId: questions.bankId,
      questionText: questions.questionText,
      description: questions.description,
      displayOrder: questions.displayOrder,
    })
    .from(questions)
    .where(inArray(questions.bankId, banks.map((b) => b.id)))
    .orderBy(questions.displayOrder, questions.id);

  return banks.map((bank) => ({
    ...bank,
    questions: allQuestions.filter((q) => q.bankId === bank.id),
  }));
};

export const findFeedbackFormWithQuestionsRepo = async (
  reviewerId: number,
  formId: number,
  tx: DbOrTx = db
) => {
  const [form] = await tx
    .select({ id: feedbackForms.id, name: feedbackForms.name })
    .from(feedbackForms)
    .where(and(eq(feedbackForms.id, formId), eq(feedbackForms.reviewerId, reviewerId)));

  if (!form) {
    return null;
  }

  const formQuestions = await tx
    .select({
      id: questions.id,
      questionText: questions.questionText,
      description: questions.description,
      displayOrder: feedbackFormQuestions.displayOrder,
    })
    .from(feedbackFormQuestions)
    .innerJoin(questions, eq(feedbackFormQuestions.questionId, questions.id))
    .where(eq(feedbackFormQuestions.formId, form.id))
    .orderBy(feedbackFormQuestions.displayOrder);

  return {
    formName: form.name,
    questions: formQuestions,
  };
};

export const dashboardRepository = {
  findActiveReviewerById: findActiveReviewerByIdRepo,
  countUpcomingReviews: countUpcomingReviewsRepo,
  countCompletedReviews: countCompletedReviewsRepo,
  countActiveEventTypes: countActiveEventTypesRepo,
  findCompletedOrPastBookingDurations: findCompletedOrPastBookingDurationsRepo,
  findImminentBooking: findImminentBookingRepo,
  findPendingEvalBookings: findPendingEvalBookingsRepo,
  findActiveVacationBlockForDate: findActiveVacationBlockForDateRepo,
  findTodaysSchedule: findTodaysScheduleRepo,
  findNextReview: findNextReviewRepo,
  findRecentBookingsForActivityFeed: findRecentBookingsForActivityFeedRepo,
  findQuickShareEventTypes: findQuickShareEventTypesRepo,
  findDefaultAvailabilityTemplateWithBlocks: findDefaultAvailabilityTemplateWithBlocksRepo,
  findBookingForReferenceQuestions: findBookingForReferenceQuestionsRepo,
  findReviewerQuestionBanksWithQuestions: findReviewerQuestionBanksWithQuestionsRepo,
  findFeedbackFormWithQuestions: findFeedbackFormWithQuestionsRepo,
};
