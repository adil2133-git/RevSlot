import { eq, and, ne, asc, desc } from "drizzle-orm";
import { db } from "../../config/db.js";
import { bookings, eventTypes, feedback, feedbackForms, feedbackFormFields } from "../../db/index.js";
import { AppError } from "../../core/errors/AppError.js";
import type {
  CreateFormInput,
  UpdateFormInput,
  FormFieldInput,
  SubmitFeedbackInput,
} from "./feedback.schema.js";

// ── Feedback forms (design-time) ──────────────────────────────────────

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

export async function listForms(reviewerId: number) {
  return db
    .select()
    .from(feedbackForms)
    .where(eq(feedbackForms.reviewerId, reviewerId))
    .orderBy(desc(feedbackForms.isDefault), asc(feedbackForms.name));
}

export async function getFormWithFields(formId: number, reviewerId: number) {
  const form = await getOwnedForm(formId, reviewerId);
  const fields = await db
    .select()
    .from(feedbackFormFields)
    .where(eq(feedbackFormFields.formId, formId))
    .orderBy(asc(feedbackFormFields.displayOrder), asc(feedbackFormFields.id));
  return { ...form, fields };
}

export async function createForm(reviewerId: number, input: CreateFormInput) {
  const reviewerForms = await db.select().from(feedbackForms)
    .where(eq(feedbackForms.reviewerId, reviewerId));

  if (reviewerForms.some((f) => f.name === input.name)) {
    throw new AppError("...", 409);
  }

  const isFirstForm = reviewerForms.length === 0;   // ← new

  const [form] = await db.insert(feedbackForms)
    .values({ reviewerId, name: input.name, isDefault: isFirstForm })   // ← changed
    .returning();

  if (!form) {
    throw new AppError("Failed to create feedback form", 500);
  }

  if (input.fields?.length) {
    await replaceFields(form.id, input.fields);
  }

  return getFormWithFields(form.id, reviewerId);
}

export async function updateForm(formId: number, reviewerId: number, input: UpdateFormInput) {
  await getOwnedForm(formId, reviewerId);

  if (input.name) {
    await db
      .update(feedbackForms)
      .set({ name: input.name, updatedAt: new Date() })
      .where(eq(feedbackForms.id, formId));
  }

  if (input.fields) {
    await replaceFields(formId, input.fields);
  }

  return getFormWithFields(formId, reviewerId);
}

export async function deleteForm(formId: number, reviewerId: number) {
  const form = await getOwnedForm(formId, reviewerId);
  if (form.isDefault) {
    throw new AppError("The default feedback form cannot be deleted", 400);
  }
  // feedback_form_fields.form_id has ON DELETE CASCADE — no manual cleanup.
  await db.delete(feedbackForms).where(eq(feedbackForms.id, formId));
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
    throw new AppError("Feedback can only be submitted for confirmed sessions", 400);
  }

  const [existing] = await db.select().from(feedback).where(eq(feedback.bookingId, bookingId));
  if (existing) {
    throw new AppError("Feedback has already been submitted for this booking", 400);
  }

  const [eventType] = await db
    .select({ feedbackFormId: eventTypes.feedbackFormId })
    .from(eventTypes)
    .where(eq(eventTypes.id, booking.eventTypeId));
  if (!eventType?.feedbackFormId) {
    throw new AppError("This event type has no feedback form configured", 400);
  }

  const [form] = await db
    .select()
    .from(feedbackForms)
    .where(and(eq(feedbackForms.id, eventType.feedbackFormId), eq(feedbackForms.reviewerId, reviewerId)));
  if (!form) {
    throw new AppError("Selected feedback form not found", 404);
  }

  const [created] = await db
    .insert(feedback)
    .values({
      bookingId,
      reviewerId,
      formId: form.id,
      isNoShow: false,
      reviewMark: String(input.reviewMark),
      taskMark: String(input.taskMark),
      comments: input.comments ?? null,
      customFieldValues: input.customFieldValues ?? {},
    })
    .returning();

  if (!created) {
    throw new AppError("Failed to save feedback", 500);
  }

  return created;
}

export async function getFeedbackForBooking(bookingId: number, reviewerId: number) {
  await getOwnedBooking(bookingId, reviewerId);
  const [row] = await db.select().from(feedback).where(eq(feedback.bookingId, bookingId));
  return row ?? null;
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