import api from "@/lib/axios";
import type {
  FeedbackForm,
  FeedbackFormWithFields,
  CreateFormPayload,
  UpdateFormPayload,
  Feedback,
  SubmitFeedbackPayload,
} from "../types";

type DataEnvelope<T> = { success: true; data: T };
type MessageEnvelope = { success: true; message: string };

// ── Feedback forms (mounted at /api/feedback-forms) ────────────────────

export async function listForms() {
  const { data } = await api.get<DataEnvelope<{ forms: FeedbackForm[] }>>("/feedback-forms");
  return data.data.forms;
}

export async function getForm(formId: number) {
  const { data } = await api.get<DataEnvelope<{ form: FeedbackFormWithFields }>>(
    `/feedback-forms/${formId}`
  );
  return data.data.form;
}

export async function createForm(payload: CreateFormPayload) {
  const { data } = await api.post<DataEnvelope<{ form: FeedbackFormWithFields }>>(
    "/feedback-forms",
    payload
  );
  return data.data.form;
}

export async function updateForm(formId: number, payload: UpdateFormPayload) {
  const { data } = await api.patch<DataEnvelope<{ form: FeedbackFormWithFields }>>(
    `/feedback-forms/${formId}`,
    payload
  );
  return data.data.form;
}

export async function deleteForm(formId: number) {
  await api.delete<MessageEnvelope>(`/feedback-forms/${formId}`);
}

// ── Feedback submission (nested under /api/bookings/:id/feedback) ──────

export async function submitFeedback(bookingId: number, payload: SubmitFeedbackPayload) {
  const { data } = await api.post<DataEnvelope<{ feedback: Feedback }>>(
    `/bookings/${bookingId}/feedback`,
    payload
  );
  return data.data.feedback;
}

export async function getFeedback(bookingId: number) {
  const { data } = await api.get<DataEnvelope<{ feedback: Feedback | null }>>(
    `/bookings/${bookingId}/feedback`
  );
  return data.data.feedback;
}