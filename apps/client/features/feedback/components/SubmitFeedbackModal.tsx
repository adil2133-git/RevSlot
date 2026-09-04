"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/common/Modal";
import { XIcon } from "@/features/booking/components/icons";
import { useFeedbackStore } from "../store/feedbackStore";
import { submitFeedback } from "../api/feedbackApi";
import { getEventTypeByIdRequest } from "@/features/eventTypes/api/eventType.api";
import type { MyBooking } from "@/features/booking/type";

interface SubmitFeedbackModalProps {
  booking: MyBooking;
  onClose: () => void;
  onSubmitted: () => void;
}

// 1.0–10.0 in half-point steps, per the backend's SubmitFeedbackSchema
// (multipleOf 0.5). A <select> keeps the reviewer from typing an invalid
// value like 7.3 that the API would just reject anyway.
const MARK_OPTIONS = Array.from({ length: 19 }, (_, i) => (1 + i * 0.5).toFixed(1));

export default function SubmitFeedbackModal({ booking, onClose, onSubmitted }: SubmitFeedbackModalProps) {
  const { selectedForm, fetchForm, clearSelectedForm } = useFeedbackStore();

  const [isNoShow, setIsNoShow] = useState(false);
  const [reviewMark, setReviewMark] = useState("");
  const [taskMark, setTaskMark] = useState("");
  const [comments, setComments] = useState("");
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvingForm, setResolvingForm] = useState(true);

  // Form is no longer picked by the reviewer here — it's whatever's
  // attached to this booking's event type (event_types.feedbackFormId),
  // same rule the backend enforces on submit. Look that up once, then
  // load its fields to render the custom-field inputs below.
  useEffect(() => {
    (async () => {
      try {
        const eventType = await getEventTypeByIdRequest(booking.eventTypeId);
        if (!eventType.feedbackFormId) {
          setError("This event type has no feedback form configured.");
          return;
        }
        await fetchForm(eventType.feedbackFormId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load feedback form.");
      } finally {
        setResolvingForm(false);
      }
    })();
    return () => clearSelectedForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking.eventTypeId]);

  const handleSubmit = async () => {
    setError(null);

    if (!isNoShow && (!reviewMark || !taskMark)) {
      setError("Review mark and task mark are required unless marking as no-show.");
      return;
    }
    if (selectedForm) {
      for (const field of selectedForm.fields) {
        if (field.required && !isNoShow && !customValues[String(field.id)]?.trim()) {
          setError(`"${field.label}" is required.`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      await submitFeedback(booking.id, {
        isNoShow,
        reviewMark: isNoShow ? undefined : Number(reviewMark),
        taskMark: isNoShow ? undefined : Number(taskMark),
        comments: comments.trim() || undefined,
        customFieldValues: isNoShow ? {} : customValues,
      });
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} widthClassName="max-w-lg">
      <div className="flex items-center justify-between border-b border-slate-100 p-6">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Leave Feedback</h2>
          <p className="mt-0.5 text-sm text-slate-400">
            {booking.internName || booking.advisorName} · {booking.eventTypeName}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-surface-hover hover:text-on-surface"
          aria-label="Close"
        >
          <XIcon />
        </button>
      </div>

      <div className="max-h-[65vh] space-y-4 overflow-y-auto p-6">
        {resolvingForm && (
          <p className="text-sm text-slate-400">Loading feedback form…</p>
        )}

        <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm">
          <input type="checkbox" checked={isNoShow} onChange={(e) => setIsNoShow(e.target.checked)} />
          Mark as no-show — the intern didn't attend this session
        </label>

        {!isNoShow && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Review mark
                </label>
                <select
                  value={reviewMark}
                  onChange={(e) => setReviewMark(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-secondary/60"
                >
                  <option value="">Select</option>
                  {MARK_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Task mark
                </label>
                <select
                  value={taskMark}
                  onChange={(e) => setTaskMark(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-secondary/60"
                >
                  <option value="">Select</option>
                  {MARK_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Comments <span className="font-normal normal-case text-slate-400">(optional)</span>
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                placeholder="Notes for this session"
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-secondary/60"
              />
            </div>

            {selectedForm?.fields.map((field) => (
              <div key={field.id}>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                  {field.label} {field.required && <span className="text-error">*</span>}
                </label>
                {field.fieldType === "textarea" ? (
                  <textarea
                    value={customValues[String(field.id)] ?? ""}
                    onChange={(e) =>
                      setCustomValues((prev) => ({ ...prev, [String(field.id)]: e.target.value }))
                    }
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-secondary/60"
                  />
                ) : field.fieldType === "select" ? (
                  <select
                    value={customValues[String(field.id)] ?? ""}
                    onChange={(e) =>
                      setCustomValues((prev) => ({ ...prev, [String(field.id)]: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-secondary/60"
                  >
                    <option value="">Select</option>
                    {(field.options ?? []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.fieldType === "number" ? "number" : "text"}
                    value={customValues[String(field.id)] ?? ""}
                    onChange={(e) =>
                      setCustomValues((prev) => ({ ...prev, [String(field.id)]: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-secondary/60"
                  />
                )}
              </div>
            ))}
          </>
        )}

        {error && <p className="text-sm text-error">{error}</p>}
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 p-6">
        <button
          onClick={onClose}
          className="rounded-lg px-5 py-2.5 font-semibold text-slate-400 hover:bg-surface-hover"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || resolvingForm}
          className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Feedback"}
        </button>
      </div>
    </Modal>
  );
}