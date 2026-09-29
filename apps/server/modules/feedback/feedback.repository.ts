import { eq, and, ne, asc, desc, ilike, or, gte, lte, sql, inArray, isNull, type InferInsertModel } from "drizzle-orm";
import { db } from "../../config/db.js";
import { bookings, eventTypes, feedback, feedbackForms, feedbackFormFields, feedbackFormQuestions, feedbackPendingQuestions } from "../../db/index.js";
import { questions } from "../questionBank/questions.schema.js";
import { questionBanks } from "../questionBank/questionBanks.schema.js";
import { reviewers } from "../auth/reviewers.schema.js";
import type { FormFieldInput } from "./feedback.validation.js";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | Transaction;

export type NewFeedback = InferInsertModel<typeof feedback>;
export type NewFeedbackForm = InferInsertModel<typeof feedbackForms>;

export const findOwnedFormRepo = async (
  formId: number,
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [form] = await tx
    .select()
    .from(feedbackForms)
    .where(and(eq(feedbackForms.id, formId), eq(feedbackForms.reviewerId, reviewerId)));
  return form;
};

export const replaceFieldsRepo = async (
  formId: number,
  fields: FormFieldInput[],
  tx: DbOrTx = db
) => {
  await tx.delete(feedbackFormFields).where(eq(feedbackFormFields.formId, formId));
  if (fields.length) {
    await tx.insert(feedbackFormFields).values(
      fields.map((f, i) => ({
        formId,
        label: f.label,
        fieldType: f.fieldType,
        options: f.fieldType === "select" ? (f.options ?? null) : null,
        required: f.required ?? false,
        displayOrder: f.displayOrder ?? i,
      }))
    );
  }
};

export const findOwnedQuestionsCountRepo = async (
  reviewerId: number,
  questionIds: number[],
  tx: DbOrTx = db
) => {
  if (questionIds.length === 0) return 0;
  const owned = await tx
    .select({ id: questions.id })
    .from(questions)
    .innerJoin(questionBanks, eq(questions.bankId, questionBanks.id))
    .where(and(eq(questionBanks.reviewerId, reviewerId), inArray(questions.id, questionIds)));
  return owned.length;
};

export const replaceFormQuestionsRepo = async (
  formId: number,
  questionIds: number[],
  tx: DbOrTx = db
) => {
  await tx.delete(feedbackFormQuestions).where(eq(feedbackFormQuestions.formId, formId));
  if (!questionIds.length) return;

  await tx.insert(feedbackFormQuestions).values(
    questionIds.map((questionId, i) => ({ formId, questionId, displayOrder: i }))
  );
};

export const listFormsRepo = async (
  reviewerId: number,
  includeArchived = false,
  tx: DbOrTx = db
) => {
  const conditions = [eq(feedbackForms.reviewerId, reviewerId)];
  if (!includeArchived) conditions.push(eq(feedbackForms.isActive, true));
  return await tx
    .select()
    .from(feedbackForms)
    .where(and(...conditions))
    .orderBy(desc(feedbackForms.isDefault), asc(feedbackForms.name));
};

export const findFormFieldsRepo = async (
  formId: number,
  tx: DbOrTx = db
) => {
  return await tx
    .select()
    .from(feedbackFormFields)
    .where(eq(feedbackFormFields.formId, formId))
    .orderBy(asc(feedbackFormFields.displayOrder), asc(feedbackFormFields.id));
};

export const findAttachedQuestionsRepo = async (
  formId: number,
  tx: DbOrTx = db
) => {
  return await tx
    .select({
      id: questions.id,
      questionText: questions.questionText,
      description: questions.description,
      displayOrder: feedbackFormQuestions.displayOrder,
    })
    .from(feedbackFormQuestions)
    .innerJoin(questions, eq(feedbackFormQuestions.questionId, questions.id))
    .where(eq(feedbackFormQuestions.formId, formId))
    .orderBy(asc(feedbackFormQuestions.displayOrder));
};

export const findFormsByReviewerRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  return await tx
    .select()
    .from(feedbackForms)
    .where(eq(feedbackForms.reviewerId, reviewerId));
};

export const insertFormRepo = async (
  values: {
    reviewerId: number;
    name: string;
    description?: string | null | undefined;
    isDefault: boolean;
    taskMarkEnabled: boolean;
  },
  tx: DbOrTx = db
) => {
  const [form] = await tx
    .insert(feedbackForms)
    .values(values)
    .returning();
  return form;
};

export const updateFormRepo = async (
  formId: number,
  updates: Partial<typeof feedbackForms.$inferInsert>,
  tx: DbOrTx = db
) => {
  return await tx
    .update(feedbackForms)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(feedbackForms.id, formId));
};

export const checkFormUsedInFeedbackRepo = async (
  formId: number,
  tx: DbOrTx = db
) => {
  const [usedBy] = await tx
    .select({ id: feedback.id })
    .from(feedback)
    .where(eq(feedback.formId, formId))
    .limit(1);
  return usedBy;
};

export const archiveFormRepo = async (
  formId: number,
  tx: DbOrTx = db
) => {
  return await tx
    .update(feedbackForms)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(feedbackForms.id, formId));
};

export const deleteFormRepo = async (
  formId: number,
  tx: DbOrTx = db
) => {
  return await tx.delete(feedbackForms).where(eq(feedbackForms.id, formId));
};

export const reactivateFormRepo = async (
  formId: number,
  tx: DbOrTx = db
) => {
  return await tx
    .update(feedbackForms)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(feedbackForms.id, formId));
};

export const findOwnedBookingRepo = async (
  bookingId: number,
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [booking] = await tx
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.reviewerId, reviewerId)));
  return booking;
};

export const findFeedbackByBookingIdRepo = async (
  bookingId: number,
  tx: DbOrTx = db
) => {
  const [row] = await tx.select().from(feedback).where(eq(feedback.bookingId, bookingId));
  return row;
};

export const insertFeedbackRepo = async (
  values: NewFeedback,
  tx: DbOrTx = db
) => {
  const [created] = await tx
    .insert(feedback)
    .values(values)
    .returning();
  return created;
};

export const insertPendingQuestionsRepo = async (
  feedbackId: number,
  questionIds: number[],
  tx: DbOrTx = db
) => {
  if (!questionIds.length) return;
  return await tx.insert(feedbackPendingQuestions).values(
    questionIds.map((questionId) => ({ feedbackId, questionId }))
  );
};

export const findReviewerNameByIdRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [reviewer] = await tx
    .select({ name: reviewers.name })
    .from(reviewers)
    .where(eq(reviewers.id, reviewerId))
    .limit(1);
  return reviewer;
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
  return eventType;
};

export const updateFeedbackRepo = async (
  bookingId: number,
  values: Partial<typeof feedback.$inferInsert>,
  tx: DbOrTx = db
) => {
  const [updated] = await tx
    .update(feedback)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(eq(feedback.bookingId, bookingId))
    .returning();
  return updated;
};

export const replaceFeedbackPendingQuestionsRepo = async (
  feedbackId: number,
  questionIds: number[],
  tx: DbOrTx = db
) => {
  await tx
    .delete(feedbackPendingQuestions)
    .where(eq(feedbackPendingQuestions.feedbackId, feedbackId));

  if (questionIds.length > 0) {
    await tx.insert(feedbackPendingQuestions).values(
      questionIds.map((questionId) => ({
        feedbackId,
        questionId,
      }))
    );
  }
};

export const updatePendingQuestionStatusRepo = async (
  pendingQuestionId: number,
  feedbackId: number,
  status: "pending" | "reviewed",
  tx: DbOrTx = db
) => {
  const [updated] = await tx
    .update(feedbackPendingQuestions)
    .set({ status, completedAt: status === "reviewed" ? new Date() : null })
    .where(and(eq(feedbackPendingQuestions.id, pendingQuestionId), eq(feedbackPendingQuestions.feedbackId, feedbackId)))
    .returning();
  return updated;
};

export const findFormHeaderByIdRepo = async (
  formId: number,
  tx: DbOrTx = db
) => {
  const [form] = await tx
    .select({
      id: feedbackForms.id,
      name: feedbackForms.name,
      taskMarkEnabled: feedbackForms.taskMarkEnabled,
      isActive: feedbackForms.isActive,
    })
    .from(feedbackForms)
    .where(eq(feedbackForms.id, formId));
  return form;
};

export const findPendingQuestionsWithDetailsRepo = async (
  feedbackId: number,
  tx: DbOrTx = db
) => {
  return await tx
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

export interface ListFeedbackRepoFilter {
  reviewerId: number;
  formId?: number | undefined;
  from?: Date | undefined;
  to?: Date | undefined;
  search?: string | undefined;
  page: number;
  pageSize: number;
}

export const listFeedbackPaginatedRepo = async (
  filter: ListFeedbackRepoFilter,
  tx: DbOrTx = db
) => {
  const conditions = [eq(feedback.reviewerId, filter.reviewerId)];
  if (filter.formId) conditions.push(eq(feedback.formId, filter.formId));
  if (filter.from) conditions.push(gte(feedback.createdAt, filter.from));
  if (filter.to) conditions.push(lte(feedback.createdAt, filter.to));
  if (filter.search) {
    const term = `%${filter.search}%`;
    const searchCondition = or(ilike(bookings.internName, term), ilike(bookings.advisorName, term));
    if (searchCondition) conditions.push(searchCondition);
  }
  const where = and(...conditions);

  const [rows, countRow] = await Promise.all([
    tx
      .select({
        id: feedback.id,
        bookingId: feedback.bookingId,
        isNoShow: feedback.isNoShow,
        reviewMark: feedback.reviewMark,
        understandingLevel: feedback.understandingLevel,
        taskMark: feedback.taskMark,
        createdAt: feedback.createdAt,
        formName: feedbackForms.name,
        internName: bookings.internName,
        advisorName: bookings.advisorName,
        eventTypeName: eventTypes.name,
      })
      .from(feedback)
      .innerJoin(bookings, eq(feedback.bookingId, bookings.id))
      .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
      .leftJoin(feedbackForms, eq(feedback.formId, feedbackForms.id))
      .where(where)
      .orderBy(desc(feedback.createdAt))
      .limit(filter.pageSize)
      .offset((filter.page - 1) * filter.pageSize),
    tx
      .select({ count: sql<number>`count(*)::int` })
      .from(feedback)
      .innerJoin(bookings, eq(feedback.bookingId, bookings.id))
      .where(where),
  ]);

  return {
    rows,
    total: countRow[0]?.count ?? 0,
  };
};

export const listPendingFeedbackRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  return await tx
    .select({
      bookingId: bookings.id,
      internName: bookings.internName,
      advisorName: bookings.advisorName,
      endTime: bookings.endTime,
      eventTypeName: eventTypes.name,
    })
    .from(bookings)
    .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
    .leftJoin(feedback, eq(feedback.bookingId, bookings.id))
    .where(
      and(
        eq(bookings.reviewerId, reviewerId),
        eq(bookings.status, "completed"),
        isNull(feedback.id)
      )
    )
    .orderBy(desc(bookings.endTime));
};

export const getInternHistoryRepo = async (
  reviewerId: number,
  internName: string,
  batch: string,
  excludeBookingId?: number | undefined,
  tx: DbOrTx = db
) => {
  const conditions = [
    eq(feedback.reviewerId, reviewerId),
    eq(bookings.internName, internName),
    eq(bookings.batch, batch),
  ];
  if (excludeBookingId !== undefined) {
    conditions.push(ne(feedback.bookingId, excludeBookingId));
  }

  return await tx
    .select({
      feedbackId: feedback.id,
      bookingId: feedback.bookingId,
      reviewMark: feedback.reviewMark,
      understandingLevel: feedback.understandingLevel,
      taskMark: feedback.taskMark,
      comments: feedback.comments,
      isNoShow: feedback.isNoShow,
      createdAt: feedback.createdAt,
      eventTypeName: eventTypes.name,
      weekStage: bookings.weekStage,
    })
    .from(feedback)
    .innerJoin(bookings, eq(feedback.bookingId, bookings.id))
    .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
    .where(and(...conditions))
    .orderBy(desc(feedback.createdAt));
};

export const feedbackRepository = {
  findOwnedForm: findOwnedFormRepo,
  replaceFields: replaceFieldsRepo,
  findOwnedQuestionsCount: findOwnedQuestionsCountRepo,
  replaceFormQuestions: replaceFormQuestionsRepo,
  listForms: listFormsRepo,
  findFormFields: findFormFieldsRepo,
  findAttachedQuestions: findAttachedQuestionsRepo,
  findFormsByReviewer: findFormsByReviewerRepo,
  insertForm: insertFormRepo,
  updateForm: updateFormRepo,
  checkFormUsedInFeedback: checkFormUsedInFeedbackRepo,
  archiveForm: archiveFormRepo,
  deleteForm: deleteFormRepo,
  reactivateForm: reactivateFormRepo,
  findOwnedBooking: findOwnedBookingRepo,
  findFeedbackByBookingId: findFeedbackByBookingIdRepo,
  insertFeedback: insertFeedbackRepo,
  insertPendingQuestions: insertPendingQuestionsRepo,
  findReviewerNameById: findReviewerNameByIdRepo,
  findEventTypeNameById: findEventTypeNameByIdRepo,
  updateFeedback: updateFeedbackRepo,
  replaceFeedbackPendingQuestions: replaceFeedbackPendingQuestionsRepo,
  updatePendingQuestionStatus: updatePendingQuestionStatusRepo,
  findFormHeaderById: findFormHeaderByIdRepo,
  findPendingQuestionsWithDetails: findPendingQuestionsWithDetailsRepo,
  listFeedbackPaginated: listFeedbackPaginatedRepo,
  listPendingFeedback: listPendingFeedbackRepo,
  getInternHistory: getInternHistoryRepo,
};
