import { emailService } from "../../services/email.service.js";
import { feedbackSubmittedTemplate, feedbackSubmittedTemplateData } from "../../emails/templates/feedbackSubmitted.js";
import { notificationService } from "../notification/notification.service.js";
import { AppError } from "../../core/errors/AppError.js";
import type {
  CreateFormInput,
  UpdateFormInput,
  FormFieldInput,
  SubmitFeedbackInput,
  UpdateFeedbackInput,
  ListFeedbackQueryInput,
} from "./feedback.validation.js";
import {
  findOwnedFormRepo,
  replaceFieldsRepo,
  findOwnedQuestionsCountRepo,
  replaceFormQuestionsRepo,
  listFormsRepo,
  findFormFieldsRepo,
  findAttachedQuestionsRepo,
  findFormsByReviewerRepo,
  insertFormRepo,
  updateFormRepo,
  checkFormUsedInFeedbackRepo,
  archiveFormRepo,
  deleteFormRepo,
  reactivateFormRepo,
  findOwnedBookingRepo,
  findFeedbackByBookingIdRepo,
  insertFeedbackRepo,
  insertPendingQuestionsRepo,
  findReviewerNameByIdRepo,
  findEventTypeNameByIdRepo,
  updateFeedbackRepo,
  replaceFeedbackPendingQuestionsRepo,
  updatePendingQuestionStatusRepo,
  findFormHeaderByIdRepo,
  findPendingQuestionsWithDetailsRepo,
  listFeedbackPaginatedRepo,
  listPendingFeedbackRepo,
  getInternHistoryRepo,
} from "./feedback.repository.js";

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
  const form = await findOwnedFormRepo(formId, reviewerId);
  if (!form) {
    throw new AppError("Feedback form not found", 404);
  }
  return form;
}

async function validateOwnedQuestions(reviewerId: number, questionIds: number[]) {
  const count = await findOwnedQuestionsCountRepo(reviewerId, questionIds);
  if (count !== new Set(questionIds).size) {
    throw new AppError("One or more questions were not found in your question banks", 400);
  }
}

async function assignPendingQuestions(feedbackId: number, reviewerId: number, questionIds: number[]) {
  if (!questionIds.length) return;
  await validateOwnedQuestions(reviewerId, questionIds);
  await insertPendingQuestionsRepo(feedbackId, questionIds);
}

export async function listForms(reviewerId: number, includeArchived = false) {
  return await listFormsRepo(reviewerId, includeArchived);
}

export async function getFormWithFields(formId: number, reviewerId: number) {
  const form = await getOwnedForm(formId, reviewerId);
  const fields = await findFormFieldsRepo(formId);
  const attachedQuestions = await findAttachedQuestionsRepo(formId);

  return { ...form, fields, questions: attachedQuestions };
}

export async function createForm(reviewerId: number, input: CreateFormInput) {
  const reviewerForms = await findFormsByReviewerRepo(reviewerId);

  if (reviewerForms.some((f) => f.name === input.name)) {
    throw new AppError("A feedback form with this name already exists", 409);
  }

  const isFirstForm = reviewerForms.length === 0;

  const form = await insertFormRepo({
    reviewerId,
    name: input.name,
    description: input.description ?? null,
    isDefault: isFirstForm,
    taskMarkEnabled: input.taskMarkEnabled ?? false,
  });

  if (!form) {
    throw new AppError("Failed to create feedback form", 500);
  }

  const customFields = (input.fields ?? []).map((f, i) => ({
    ...f,
    displayOrder: DEFAULT_FORM_FIELDS.length + i,
  }));

  const allFields = [...DEFAULT_FORM_FIELDS, ...customFields];
  if (allFields.length) {
    await replaceFieldsRepo(form.id, allFields);
  }

  if (input.questionIds?.length) {
    await validateOwnedQuestions(reviewerId, input.questionIds);
    await replaceFormQuestionsRepo(form.id, input.questionIds);
  }

  return getFormWithFields(form.id, reviewerId);
}

export async function updateForm(formId: number, reviewerId: number, input: UpdateFormInput) {
  await getOwnedForm(formId, reviewerId);

  const updates: Record<string, unknown> = {};
  if (input.name) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description || null;
  if (input.taskMarkEnabled !== undefined) updates.taskMarkEnabled = input.taskMarkEnabled;

  if (Object.keys(updates).length) {
    await updateFormRepo(formId, updates);
  }

  if (input.fields) {
    const customFields = input.fields.map((f, i) => ({
      ...f,
      displayOrder: DEFAULT_FORM_FIELDS.length + i,
    }));

    await replaceFieldsRepo(formId, [
      ...DEFAULT_FORM_FIELDS,
      ...customFields,
    ]);
  }

  if (input.questionIds) {
    await validateOwnedQuestions(reviewerId, input.questionIds);
    await replaceFormQuestionsRepo(formId, input.questionIds);
  }

  return getFormWithFields(formId, reviewerId);
}

export async function deleteForm(formId: number, reviewerId: number) {
  const form = await getOwnedForm(formId, reviewerId);
  if (form.isDefault) {
    throw new AppError("The default feedback form cannot be deleted", 400);
  }
  const usedBy = await checkFormUsedInFeedbackRepo(formId);
  if (usedBy) {
    await archiveFormRepo(formId);
    return { archived: true as const, message: "Feedback form archived because it has existing feedback." };
  }
  await deleteFormRepo(formId);
  return { archived: false as const, message: "Feedback form deleted successfully." };
}

export async function reactivateForm(formId: number, reviewerId: number) {
  await getOwnedForm(formId, reviewerId);
  await reactivateFormRepo(formId);
  return getFormWithFields(formId, reviewerId);
}

// ── Feedback submission (per booking) ─────────────────────────────────

async function getOwnedBooking(bookingId: number, reviewerId: number) {
  const booking = await findOwnedBookingRepo(bookingId, reviewerId);
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

  const existing = await findFeedbackByBookingIdRepo(bookingId);
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
  const fields = await findFormFieldsRepo(form.id);

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

  const created = await insertFeedbackRepo({
    bookingId,
    reviewerId,
    formId: form.id,
    isNoShow: input.isNoShow,
    reviewMark: input.isNoShow ? null : String(input.reviewMark),
    understandingLevel: input.isNoShow ? null : input.understandingLevel,
    taskMark: input.isNoShow || effectiveTaskMark === undefined ? null : String(effectiveTaskMark),
    comments: input.comments ?? null,
    customFieldValues: snapshotValues,
  });

  if (!created) {
    throw new AppError("Failed to save feedback", 500);
  }

  if (!input.isNoShow && input.pendingQuestionIds?.length) {
    await assignPendingQuestions(created.id, reviewerId, input.pendingQuestionIds);
  }

  // 1. In-app notification to Reviewer (Socket.IO live alert)
  await notificationService.createNotification({
    reviewerId,
    type: "feedback_submitted",
    title: "Feedback recorded",
    message: `Feedback for ${booking.internName} (${booking.weekStage}) recorded successfully`,
    bookingId,
  });

  // 2. Email summary to Advisor & Intern(s)
  const reviewer = await findReviewerNameByIdRepo(reviewerId);
  const eventType = await findEventTypeNameByIdRepo(booking.eventTypeId);

  const recipients: { email: string; name: string; role: "advisor" | "intern" }[] = [
    { email: booking.advisorEmail, name: booking.advisorName, role: "advisor" },
    ...(booking.internEmails ?? []).map((email) => ({
      email,
      name: booking.internName,
      role: "intern" as const,
    })),
  ];

  await Promise.all(
    recipients.map(({ email, name, role }) => {
      const { html: fallbackHtml } = feedbackSubmittedTemplate({
        recipientName: name,
        recipientRole: role,
        eventTypeName: eventType?.name || "Review Session",
        reviewerName: reviewer?.name || "Reviewer",
        internName: booking.internName,
        reviewMark: input.isNoShow ? null : input.reviewMark !== undefined ? String(input.reviewMark) : null,
        understandingLevel: input.isNoShow ? null : input.understandingLevel || null,
        taskMark: input.isNoShow || effectiveTaskMark === undefined ? null : String(effectiveTaskMark),
        comments: input.comments || null,
        isNoShow: input.isNoShow,
      });
      const { templateId, subject, variables } = feedbackSubmittedTemplateData({
        recipientName: name,
        recipientRole: role,
        eventTypeName: eventType?.name || "Review Session",
        reviewerName: reviewer?.name || "Reviewer",
        internName: booking.internName,
        reviewMark: input.isNoShow ? null : input.reviewMark !== undefined ? String(input.reviewMark) : null,
        understandingLevel: input.isNoShow ? null : input.understandingLevel || null,
        taskMark: input.isNoShow || effectiveTaskMark === undefined ? null : String(effectiveTaskMark),
        comments: input.comments || null,
        isNoShow: input.isNoShow,
      });

      return emailService.sendTemplateEmail({ to: email, templateId, subject, variables, fallbackHtml }).catch((err) => {
        console.error(`[Feedback] Failed to send evaluation email to ${email}:`, err);
      });
    })
  );

  return created;
}

export const EDIT_WINDOW_HOURS = 24;

export async function updateFeedback(bookingId: number, reviewerId: number, input: UpdateFeedbackInput) {
  await getOwnedBooking(bookingId, reviewerId);

  const existing = await findFeedbackByBookingIdRepo(bookingId);
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

  const form = await findFormHeaderByIdRepo(existing.formId);
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

  const updated = await updateFeedbackRepo(bookingId, {
    reviewMark: existing.isNoShow
      ? null
      : input.reviewMark !== undefined
      ? String(input.reviewMark)
      : existing.reviewMark,
    understandingLevel: existing.isNoShow ? null : input.understandingLevel ?? existing.understandingLevel,
    taskMark: existing.isNoShow || effectiveTaskMark === undefined ? null : String(effectiveTaskMark),
    comments: input.comments ?? null,
    customFieldValues: snapshotValues,
  });

  if (!updated) {
    throw new AppError("Failed to update feedback", 500);
  }

  if (input.pendingQuestionIds !== undefined) {
    await validateOwnedQuestions(reviewerId, input.pendingQuestionIds);
    await replaceFeedbackPendingQuestionsRepo(existing.id, input.pendingQuestionIds);
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
  const row = await findFeedbackByBookingIdRepo(bookingId);
  if (!row) throw new AppError("Feedback not found for this booking", 404);

  const updated = await updatePendingQuestionStatusRepo(pendingQuestionId, row.id, status);

  if (!updated) throw new AppError("Pending question not found", 404);
  return updated;
}

export async function getFeedbackForBooking(bookingId: number, reviewerId: number) {
  await getOwnedBooking(bookingId, reviewerId);
  const row = await findFeedbackByBookingIdRepo(bookingId);
  return row ?? null;
}

export async function getFeedbackDetailsForBooking(bookingId: number, reviewerId: number) {
  const booking = await getOwnedBooking(bookingId, reviewerId);

  const row = await findFeedbackByBookingIdRepo(bookingId);
  if (!row) return null;

  const form = await findFormHeaderByIdRepo(row.formId);
  const eventType = await findEventTypeNameByIdRepo(booking.eventTypeId);

  const customFields = Object.entries(row.customFieldValues ?? {}).map(([fieldId, entry]) => ({
    id: Number(fieldId),
    label: entry.label,
    fieldType: entry.fieldType,
    value: entry.value,
    options: entry.options ?? null,
  }));

  const submittedAt = row.createdAt ?? new Date();
  const editableUntil = new Date(submittedAt.getTime() + EDIT_WINDOW_HOURS * 60 * 60 * 1000);

  const pendingQuestions = await findPendingQuestionsWithDetailsRepo(row.id);

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

  const { rows, total } = await listFeedbackPaginatedRepo({
    reviewerId,
    formId,
    from,
    to,
    search,
    page,
    pageSize,
  });

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
    total,
    page,
    pageSize,
  };
}

// Completed sessions that don't have a feedback row yet — drives the
// "Pending Feedback" card on the Feedback & Forms page.
export async function listPendingFeedback(reviewerId: number) {
  const rows = await listPendingFeedbackRepo(reviewerId);

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
  return await getInternHistoryRepo(reviewerId, internName, batch, excludeBookingId);
}