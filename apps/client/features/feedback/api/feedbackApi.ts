import api from "@/lib/axios";
import type {
  FeedbackForm,
  FeedbackFormWithFields,
  CreateFormPayload,
  UpdateFormPayload,
  Feedback,
  SubmitFeedbackPayload,
  UpdateFeedbackPayload,
  FeedbackDetails,
  ListFeedbackParams,
  ListFeedbackResponse,
  PendingFeedbackItem,
  DeleteFormResult,
} from "../types";

type DataEnvelope<T> = { success: true; data: T };

// ── Feedback forms (mounted at /api/feedback-forms) ────────────────────

export async function listForms(includeArchived = false) {
  const { data } = await api.get<DataEnvelope<{ forms: FeedbackForm[] }>>("/feedback-forms", {
    params: includeArchived ? { includeArchived: true } : undefined,
  });
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

export async function deleteForm(formId: number): Promise<DeleteFormResult> {
  const { data } = await api.delete<DataEnvelope<DeleteFormResult>>(
    `/feedback-forms/${formId}`
  );

  return data.data;
}

export async function reactivateForm(formId: number) {
  const { data } = await api.post<DataEnvelope<{ form: FeedbackFormWithFields }>>(
    `/feedback-forms/${formId}/reactivate`
  );
  return data.data.form;
}

// ── Feedback submission (nested under /api/bookings/:id/feedback) ──────

export async function submitFeedback(bookingId: number, payload: SubmitFeedbackPayload) {
  const { data } = await api.post<DataEnvelope<{ feedback: Feedback }>>(
    `/bookings/${bookingId}/feedback`,
    payload
  );
  return data.data.feedback;
}

export async function updateFeedback(bookingId: number, payload: UpdateFeedbackPayload) {
  const { data } = await api.patch<DataEnvelope<{ feedback: Feedback }>>(
    `/bookings/${bookingId}/feedback`,
    payload
  );
  return data.data.feedback;
}

export async function getFeedback(bookingId: number) {
  const { data } = await api.get<DataEnvelope<{ feedback: FeedbackDetails | null }>>(
    `/bookings/${bookingId}/feedback`
  );
  return data.data.feedback;
}

export async function listFeedback(params: ListFeedbackParams = {}) {
  const { data } = await api.get<DataEnvelope<ListFeedbackResponse>>("/feedback", { params });
  return data.data;
}

export async function listPendingFeedback() {
  const { data } = await api.get<DataEnvelope<{ items: PendingFeedbackItem[] }>>("/feedback/pending");
  return data.data.items;
}