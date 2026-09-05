import type { Request, Response } from "express";
import * as feedbackService from "./feedback.service.js";
import { InternHistoryQuerySchema } from "./feedback.schema.js";

function reviewerId(req: Request): number {
  return req.user!.userId;
}

// ── Feedback forms ──────────────────────────────────────────────────

export async function listForms(req: Request, res: Response) {
  const forms = await feedbackService.listForms(reviewerId(req));
  res.status(200).json({ success: true, data: { forms } });
}

export async function getForm(req: Request, res: Response) {
  const formId = Number(req.params.formId);
  const form = await feedbackService.getFormWithFields(formId, reviewerId(req));
  res.status(200).json({ success: true, data: { form } });
}

export async function createForm(req: Request, res: Response) {
  const form = await feedbackService.createForm(reviewerId(req), req.body);
  res.status(201).json({ success: true, data: { form } });
}

export async function updateForm(req: Request, res: Response) {
  const formId = Number(req.params.formId);
  const form = await feedbackService.updateForm(formId, reviewerId(req), req.body);
  res.status(200).json({ success: true, data: { form } });
}

export async function deleteForm(req: Request, res: Response) {
  const formId = Number(req.params.formId);
  await feedbackService.deleteForm(formId, reviewerId(req));
  res.status(200).json({ success: true, message: "Feedback form deleted" });
}

// ── Feedback submission ─────────────────────────────────────────────

export async function submitFeedback(req: Request, res: Response) {
  const bookingId = Number(req.params.id);
  const result = await feedbackService.submitFeedback(bookingId, reviewerId(req), req.body);
  res.status(201).json({ success: true, data: { feedback: result } });
}

export async function updateFeedback(req: Request, res: Response) {
  const bookingId = Number(req.params.id);
  const result = await feedbackService.updateFeedback(bookingId, reviewerId(req), req.body);
  res.status(200).json({ success: true, data: { feedback: result } });
}

export async function getFeedback(req: Request, res: Response) {
  const bookingId = Number(req.params.id);
  const result = await feedbackService.getFeedbackDetailsForBooking(bookingId, reviewerId(req));   // ✅
  res.status(200).json({ success: true, data: { feedback: result } });
}

export async function getInternHistory(req: Request, res: Response) {
  const { internName, batch, excludeBookingId } = InternHistoryQuerySchema.parse(req.query);
  const history = await feedbackService.getInternHistory(
    reviewerId(req),
    internName,
    batch,
    excludeBookingId
  );
  res.status(200).json({ success: true, data: { history } });
}