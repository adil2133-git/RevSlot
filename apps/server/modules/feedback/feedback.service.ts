import { eq, and, ne, asc, desc, ilike, or, gte, lte, sql, inArray, isNull } from "drizzle-orm";
import { db } from "../../config/db.js";
import { bookings, eventTypes, feedback, feedbackForms, feedbackFormFields, feedbackFormQuestions, feedbackPendingQuestions, } from "../../db/index.js";
import { questions } from "../questionBank/questions.model.js";
import { questionBanks } from "../questionBank/questionBanks.model.js";
import { AppError } from "../../core/errors/AppError.js";
import type {
  CreateFormInput,
  UpdateFormInput,
  FormFieldInput,
  SubmitFeedbackInput,
  UpdateFeedbackInput,
  ListFeedbackQueryInput,
} from "./feedback.schema.js";

// ── Feedback forms (design-time) ──────────────────────────────────────

const DEFAULT_FORM_FIELDS: FormFieldInput[] = [
  {
    label: "Communication Level",
    fieldType: "select",
    options: ["Excellent", "Good", "Average", "Needs Improvement"],
    required: false,
    displayOrder: 0,
  },
  {
    label: "Overall Performance",
    fieldType: "select",
    options: ["Excellent", "Good", "Average", "Needs Improvement"],
    required: false,
    displayOrder: 1,
  },
  {
    label: "Areas for Improvement",
    fieldType: "textarea",
    required: false,
    displayOrder: 2,
  },
  {
    label: "Recommendations / Next Steps",
    fieldType: "textarea",
    required: false,
    displayOrder: 3,
  },
] as FormFieldInput[];

async function getOwnedForm(formId: number, reviewerId: number) {
  const [form] = await db
    .select()
    .from(feedbackForms)
    .where(and(eq(feedbackForms.id, formId), eq(feedbackForms.reviewerId, reviewerId)));
  if (!form) {
    throw new AppError("Feedback form not found", 404);
  }
  return form;
}

async function replaceFields(formId: number, fields: FormFieldInput[]) {
  // Full replace, not a diff — the field list per form is small and
  // reviewer-curated, so this stays simple over clever.
  await db.delete(feedbackFormFields).where(eq(feedbackFormFields.formId, formId));
  if (fields.length) {
    await db.insert(feedbackFormFields).values(
      fields.map((f, i) => ({
        formId,
        label: f.label,
        fieldType: f.fieldType,
        options: f.fieldType === "select" ? f.options : null,
        required: f.required ?? false,
        displayOrder: f.displayOrder ?? i,
      }))
    );
  }
}

async function validateOwnedQuestions(reviewerId: number, questionIds: number[]) {
  const owned = await db
    .select({ id: questions.id })
    .from(questions)
    .innerJoin(questionBanks, eq(questions.bankId, questionBanks.id))
    .where(and(eq(questionBanks.reviewerId, reviewerId), inArray(questions.id, questionIds)));

  if (owned.length !== new Set(questionIds).size) {
    throw new AppError("One or more questions were not found in your question banks", 400);
  }
}

async function assignPendingQuestions(feedbackId: number, reviewerId: number, questionIds: number[]) {
  if (!questionIds.length) return;
  await validateOwnedQuestions(reviewerId, questionIds);
  await db.insert(feedbackPendingQuestions).values(
    questionIds.map((questionId) => ({ feedbackId, questionId }))
  );
}

async function replaceFormQuestions(formId: number, questionIds: number[]) {
  await db.delete(feedbackFormQuestions).where(eq(feedbackFormQuestions.formId, formId));
  if (!questionIds.length) return;

  await db.insert(feedbackFormQuestions).values(
    questionIds.map((questionId, i) => ({ formId, questionId, displayOrder: i }))
  );
}

export async function listForms(reviewerId: number, includeArchived = false) {
  const conditions = [eq(feedbackForms.reviewerId, reviewerId)];
  if (!includeArchived) conditions.push(eq(feedbackForms.isActive, true));
  return db
    .select()
    .from(feedbackForms)
    .where(and(...conditions))
    .orderBy(desc(feedbackForms.isDefault), asc(feedbackForms.name));
}

export async function getFormWithFields(formId: number, reviewerId: number) {
  const form = await getOwnedForm(formId, reviewerId);
  const fields = await db
    .select()
    .from(feedbackFormFields)
    .where(eq(feedbackFormFields.formId, formId))
    .orderBy(asc(feedbackFormFields.displayOrder), asc(feedbackFormFields.id));

 const attachedQuestions = await db
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

  return { ...form, fields, questions: attachedQuestions };
}

export async function createForm(reviewerId: number, input: CreateFormInput) {
  const reviewerForms = await db.select().from(feedbackForms)
    .where(eq(feedbackForms.reviewerId, reviewerId));

  if (reviewerForms.some((f) => f.name === input.name)) {
    throw new AppError("A feedback form with this name already exists", 409);
  }

  const isFirstForm = reviewerForms.length === 0;   

  const [form] = await db.insert(feedbackForms)
        .values({ reviewerId, name: input.name, description: input.description ?? null, isDefault: isFirstForm, taskMarkEnabled: input.taskMarkEnabled ?? false, })
    .returning();

  if (!form) {
    throw new AppError("Failed to create feedback form", 500);
  }

  const customFields = (input.fields ?? []).map((f, i) => ({
  ...f,
  displayOrder: DEFAULT_FORM_FIELDS.length + i,
}));

const allFields = [...DEFAULT_FORM_FIELDS, ...customFields];
  if (allFields.length) {
    await replaceFields(form.id, allFields);
  }

  if (input.questionIds?.length) {
    await validateOwnedQuestions(reviewerId, input.questionIds);
    await replaceFormQuestions(form.id, input.questionIds);
  }

  return getFormWithFields(form.id, reviewerId);
}

export async function updateForm(formId: number, reviewerId: number, input: UpdateFormInput) {
  await getOwnedForm(formId, reviewerId);

  const updates: Partial<typeof feedbackForms.$inferInsert> = {};
  if (input.name) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description || null;
  if (input.taskMarkEnabled !== undefined) updates.taskMarkEnabled = input.taskMarkEnabled;

  if (Object.keys(updates).length) {
    await db
      .update(feedbackForms)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(feedbackForms.id, formId));
  }

  if (input.fields) {
  const customFields = input.fields.map((f, i) => ({
    ...f,
    displayOrder: DEFAULT_FORM_FIELDS.length + i,
  }));

  await replaceFields(formId, [
    ...DEFAULT_FORM_FIELDS,
    ...customFields,
  ]);
}

  if (input.questionIds) {
    await validateOwnedQuestions(reviewerId, input.questionIds);
    await replaceFormQuestions(formId, input.questionIds);
  }

  return getFormWithFields(formId, reviewerId);
}

export async function deleteForm(formId: number, reviewerId: number) {
  const form = await getOwnedForm(formId, reviewerId);
  if (form.isDefault) {
    throw new AppError("The default feedback form cannot be deleted", 400);
  }
  const [usedBy] = await db
    .select({ id: feedback.id })
    .from(feedback)
    .where(eq(feedback.formId, formId))
    .limit(1);
  if (usedBy) {
    await db
      .update(feedbackForms)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(feedbackForms.id, formId));
    return { archived: true as const,  message: "Feedback form archived because it has existing feedback.", };
  }
   await db.delete(feedbackForms).where(eq(feedbackForms.id, formId));
  return { archived: false as const, message: "Feedback form deleted successfully.", };
}

export async function reactivateForm(formId: number, reviewerId: number) {
  await getOwnedForm(formId, reviewerId);
  await db
    .update(feedbackForms)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(feedbackForms.id, formId));
  return getFormWithFields(formId, reviewerId);
}

// ── Feedback submission (per booking) ─────────────────────────────────

async function getOwnedBooking(bookingId: number, reviewerId: number) {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.reviewerId, reviewerId)));
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }
  return booking;
}

export async function submitFeedback(bookingId: number, reviewerId: number, input: SubmitFeedbackInput) {
  const booking = await getOwnedBooking(bookingId, reviewerId);

  if (booking.status !== "completed") {
    throw new AppError("Feedback can only be submitted for completed sessions", 400);
  }

  if (booking.endTime.getTime() > Date.now()) {
    throw new AppError("Feedback can only be submitted after the session has ended", 400);
  }

  const [existing] = await db.select().from(feedback).where(eq(feedback.bookingId, bookingId));
  if (existing) {
    throw new AppError("Feedback has already been submitted for this booking", 400);
  }

   const form = await getOwnedForm(input.formId, reviewerId);

  if (!form.isActive) {
    throw new AppError("This feedback form has been archived and can no longer be used", 400);
  }

  if (!input.isNoShow) {
    if (form.taskMarkEnabled && input.taskMark === undefined) {
      throw new AppError("Task mark is required for this form", 400);
    }
  }
  const effectiveTaskMark = form.taskMarkEnabled ? input.taskMark : undefined;
  const fields = await db
    .select()
    .from(feedbackFormFields)
    .where(eq(feedbackFormFields.formId, form.id))
    .orderBy(asc(feedbackFormFields.displayOrder), asc(feedbackFormFields.id));

  const customFieldValues = input.isNoShow ? {} : input.customFieldValues ?? {};

  if (!input.isNoShow) {
    for (const field of fields) {
      const raw = customFieldValues[String(field.id)];

      if (field.required && (raw === undefined || raw.trim() === "")) {
        throw new AppError(`"${field.label}" is required`, 400);
      }
      if (raw === undefined || raw.trim() === "") continue;

      if (field.fieldType === "number" && Number.isNaN(Number(raw))) {
        throw new AppError(`"${field.label}" must be a number`, 400);
      }
      if (field.fieldType === "select" && field.options && !field.options.includes(raw)) {
        throw new AppError(`"${field.label}" must be one of the configured options`, 400);
      }
    }
  }

   const snapshotValues: Record<string, { label: string; fieldType: string; value: string; options?: string[] | null }> = {};
  for (const field of fields) {
    const value = customFieldValues[String(field.id)];
    if (value === undefined) continue;
    snapshotValues[String(field.id)] = {
      label: field.label,
      fieldType: field.fieldType,
      value,
      options: field.fieldType === "select" ? field.options ?? [] : null,
    };
  }

  const [created] = await db
    .insert(feedback)
    .values({
      bookingId,
      reviewerId,
      formId: form.id,
      isNoShow: input.isNoShow,
      reviewMark: input.isNoShow ? null : String(input.reviewMark),
      understandingLevel: input.isNoShow ? null : input.understandingLevel,
      taskMark:  input.isNoShow || effectiveTaskMark === undefined ? null : String(effectiveTaskMark),
      comments: input.comments ?? null,
      customFieldValues: snapshotValues,
    })
    .returning();

  if (!created) {
    throw new AppError("Failed to save feedback", 500);
  }
    if (!input.isNoShow && input.pendingQuestionIds?.length) {
    await assignPendingQuestions(created.id, reviewerId, input.pendingQuestionIds);
  }

  return created;
}


export const EDIT_WINDOW_HOURS = 24;
export async function updateFeedback(bookingId: number, reviewerId: number, input: UpdateFeedbackInput) {
  await getOwnedBooking(bookingId, reviewerId);

  const [existing] = await db.select().from(feedback).where(eq(feedback.bookingId, bookingId));
  if (!existing) {
    throw new AppError("Feedback not found for this booking", 404);
  }

  if (existing.reviewerId !== reviewerId) {
    throw new AppError("You can only edit your own feedback", 403);
  }

   const submittedAt = existing.createdAt ?? new Date();
  const editableUntil = submittedAt.getTime() + EDIT_WINDOW_HOURS * 60 * 60 * 1000;
  if (Date.now() > editableUntil) {
    throw new AppError(`Feedback is locked — the ${EDIT_WINDOW_HOURS}-hour edit window has passed`, 403);
  }

  const [form] = await db.select().from(feedbackForms).where(eq(feedbackForms.id, existing.formId));
  if (!existing.isNoShow) {
    if (form?.taskMarkEnabled && input.taskMark === undefined) {
      throw new AppError("Task mark is required for this form", 400);
    }
  }
  const effectiveTaskMark = form?.taskMarkEnabled ? input.taskMark : undefined;

  const snapshotValues: Record<string, { label: string; fieldType: string; value: string; options?: string[] | null }> = {};
  for (const [fieldId, original] of Object.entries(existing.customFieldValues ?? {})) {
    const incoming = input.customFieldValues?.[fieldId];
    const value = incoming !== undefined ? incoming : original.value;

    if (original.fieldType === "number" && value.trim() !== "" && Number.isNaN(Number(value))) {
      throw new AppError(`"${original.label}" must be a number`, 400);
    }
    if (original.fieldType === "select" && original.options && value.trim() !== "" && !original.options.includes(value)) {
      throw new AppError(`"${original.label}" must be one of the originally submitted options`, 400);
    }

    snapshotValues[fieldId] = {
      label: original.label,
      fieldType: original.fieldType,
      value,
      options: original.options ?? null,
    };
  }

  const [updated] = await db
    .update(feedback)
    .set({
      reviewMark: existing.isNoShow
        ? null
        : input.reviewMark !== undefined
        ? String(input.reviewMark)
        : existing.reviewMark,
      understandingLevel: existing.isNoShow ? null : input.understandingLevel ?? existing.understandingLevel,
      taskMark: existing.isNoShow || effectiveTaskMark === undefined ? null : String(effectiveTaskMark),
      comments: input.comments ?? null,
      customFieldValues: snapshotValues,
      updatedAt: new Date(),
    })
    .where(eq(feedback.bookingId, bookingId))
    .returning();

  if (!updated) {
    throw new AppError("Failed to update feedback", 500);
  }

  if (input.pendingQuestionIds !== undefined) {
  await validateOwnedQuestions(reviewerId, input.pendingQuestionIds);

  await db
    .delete(feedbackPendingQuestions)
    .where(eq(feedbackPendingQuestions.feedbackId, existing.id));

  if (input.pendingQuestionIds.length > 0) {
    await db.insert(feedbackPendingQuestions).values(
      input.pendingQuestionIds.map((questionId) => ({
        feedbackId: existing.id,
        questionId,
      }))
    );
  }
}
  return updated;
}

export async function updatePendingQuestionStatus(
  bookingId: number,
  pendingQuestionId: number,
  reviewerId: number,
  status: "pending" | "reviewed"
) {
  await getOwnedBooking(bookingId, reviewerId);
  const [row] = await db.select().from(feedback).where(eq(feedback.bookingId, bookingId));
  if (!row) throw new AppError("Feedback not found for this booking", 404);

  const [updated] = await db
    .update(feedbackPendingQuestions)
    .set({ status, completedAt: status === "reviewed" ? new Date() : null })
    .where(and(eq(feedbackPendingQuestions.id, pendingQuestionId), eq(feedbackPendingQuestions.feedbackId, row.id)))
    .returning();

  if (!updated) throw new AppError("Pending question not found", 404);
  return updated;
}

export async function getFeedbackForBooking(bookingId: number, reviewerId: number) {
  await getOwnedBooking(bookingId, reviewerId);
  const [row] = await db.select().from(feedback).where(eq(feedback.bookingId, bookingId));
  return row ?? null;
}

export async function getFeedbackDetailsForBooking(bookingId: number, reviewerId: number) {
  const booking = await getOwnedBooking(bookingId, reviewerId);

  const [row] = await db.select().from(feedback).where(eq(feedback.bookingId, bookingId));
  if (!row) return null;

  const [form] = await db
    .select({ id: feedbackForms.id, name: feedbackForms.name, taskMarkEnabled: feedbackForms.taskMarkEnabled, isActive: feedbackForms.isActive })
    .from(feedbackForms)
    .where(eq(feedbackForms.id, row.formId));

  const [eventType] = await db
    .select({ name: eventTypes.name })
    .from(eventTypes)
    .where(eq(eventTypes.id, booking.eventTypeId));

  const customFields = Object.entries(row.customFieldValues ?? {}).map(([fieldId, entry]) => ({
    id: Number(fieldId),
    label: entry.label,
    fieldType: entry.fieldType,
    value: entry.value,
    options: entry.options ?? null,
  }));

  const submittedAt = row.createdAt ?? new Date();
  const editableUntil = new Date(submittedAt.getTime() + EDIT_WINDOW_HOURS * 60 * 60 * 1000);

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
    .where(eq(feedbackPendingQuestions.feedbackId, row.id))
    .orderBy(asc(feedbackPendingQuestions.id));

  return {
    id: row.id,
    bookingId: row.bookingId,
    clientName: booking.internName || booking.advisorName,
    eventTypeName: eventType?.name ?? null,
    sessionDate: booking.startTime,
    formName: form?.name ?? null,
    formArchived: form ? !form.isActive : false,
    isNoShow: row.isNoShow,
    reviewMark: row.reviewMark,
    understandingLevel: row.understandingLevel,
    taskMark: row.taskMark,
    taskMarkApplicable: form?.taskMarkEnabled ?? false,
    comments: row.comments,
    customFields,
    pendingQuestions, 
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    editableUntil: editableUntil.toISOString(),
    canEdit: Date.now() <= editableUntil.getTime(),
  };
}

export async function listFeedback(reviewerId: number, query: ListFeedbackQueryInput) {
  const { search, formId, from, to, page, pageSize } = query;

  const conditions = [eq(feedback.reviewerId, reviewerId)];
  if (formId) conditions.push(eq(feedback.formId, formId));
  if (from) conditions.push(gte(feedback.createdAt, from));
  if (to) conditions.push(lte(feedback.createdAt, to));
  if (search) {
    const term = `%${search}%`;
    const searchCondition = or(ilike(bookings.internName, term), ilike(bookings.advisorName, term));
    if (searchCondition) conditions.push(searchCondition);
  }
  const where = and(...conditions);

  const rows = await db
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
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(feedback)
    .innerJoin(bookings, eq(feedback.bookingId, bookings.id))
    .where(where);
  const count = countRow?.count ?? 0;

  return {
    items: rows.map((r) => ({
      id: r.id,
      bookingId: r.bookingId,
      clientName: r.internName || r.advisorName,
      eventTypeName: r.eventTypeName,
      formName: r.formName,
      isNoShow: r.isNoShow,
      reviewMark: r.reviewMark,
      understandingLevel: r.understandingLevel,
      taskMark: r.taskMark,
      createdAt: r.createdAt,
    })),
    total: count,
    page,
    pageSize,
  };
}

// Completed sessions that don't have a feedback row yet — drives the
// "Pending Feedback" card on the Feedback & Forms page.
export async function listPendingFeedback(reviewerId: number) {
  const rows = await db
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

  return rows.map((r) => ({
    bookingId: r.bookingId,
    clientName: r.internName || r.advisorName,
    internName: r.internName,
    advisorName: r.advisorName,
    eventTypeName: r.eventTypeName,
    completedAt: r.endTime,
  }));
}

// Doc section 3.7 — exact intern-name + batch match only, scoped to this
// reviewer's own past feedback (no fuzzy matching, no cross-reviewer data).
export async function getInternHistory(
  reviewerId: number,
  internName: string,
  batch: string,
  excludeBookingId?: number
) {
  const conditions = [
    eq(feedback.reviewerId, reviewerId),
    eq(bookings.internName, internName),
    eq(bookings.batch, batch),
  ];
  if (excludeBookingId) {
    conditions.push(ne(feedback.bookingId, excludeBookingId));
  }

  return db
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
}