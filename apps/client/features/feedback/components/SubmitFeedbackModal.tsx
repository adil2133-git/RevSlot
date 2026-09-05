"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/common/Modal";
import { XIcon } from "@/features/booking/components/icons";
import { useFeedbackStore } from "../store/feedbackStore";
import { submitFeedback } from "../api/feedbackApi";
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
  const { forms, selectedForm, isLoading, fetchForms, fetchForm, clearSelectedForm } = useFeedbackStore();

  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  const [reviewMark, setReviewMark] = useState("");
  const [taskMark, setTaskMark] = useState("");
  const [comments, setComments] = useState("");
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the reviewer's form library once when the modal opens.
  useEffect(() => {
    fetchForms();
    return () => clearSelectedForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-pick a starting form once the list arrives: their default form
  // if they have one, otherwise the first. Reviewer can still switch —
  // this is a starting point, not a lock (see handleSelectForm).
  useEffect(() => {
    if (forms.length === 0 || selectedFormId !== null) return;
    const preferred = forms.find((f) => f.isDefault) ?? forms[0];
    handleSelectForm(preferred.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forms]);

  const handleSelectForm = (formId: number) => {
    setSelectedFormId(formId);
    setCustomValues({}); // different form = different fields, don't carry over stale answers
    fetchForm(formId);
  };

  const handleSubmit = async () => {
    setError(null);

    if (!selectedFormId) {
      setError("Please choose a feedback form.");
      return;
    }
    if (!reviewMark || !taskMark) {
      setError("Review mark and task mark are required.");
      return;
    }
    if (selectedForm) {
      for (const field of selectedForm.fields) {
        if (field.required && !customValues[String(field.id)]?.trim()) {
          setError(`"${field.label}" is required.`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      await submitFeedback(booking.id, {
        formId: selectedFormId,
        reviewMark: Number(reviewMark),
        taskMark: Number(taskMark),
        comments: comments.trim() || undefined,
        customFieldValues: customValues,
      });
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const showPicker = forms.length > 1;
  const noFormsYet = !isLoading && forms.length === 0;

  return (
    <Modal onClose={onClose}>
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

      {noFormsYet && (
        <div className="p-6">
          <p className="text-sm text-slate-500">
            You don&apos;t have any feedback forms yet.{" "}
            <a
              href="/dashboard/feedback-forms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline"
            >
              Create one
            </a>{" "}
            to start leaving feedback.
          </p>
        </div>
      )}

      {!noFormsYet && (
        <div className={`flex max-h-[65vh] ${showPicker ? "divide-x divide-slate-100" : ""}`}>
          {showPicker && (
            <div className="w-48 shrink-0 space-y-1 overflow-y-auto p-4">
              <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Feedback Forms
              </p>
              {forms.map((form) => (
                <button
                  key={form.id}
                  type="button"
                  onClick={() => handleSelectForm(form.id)}
                  className={`flex w-full items-center gap-1.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors ${
                    selectedFormId === form.id
                      ? "bg-secondary text-primary"
                      : "text-slate-600 hover:bg-surface-hover"
                  }`}
                >
                  {form.isDefault && <span>⭐</span>}
                  {form.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {isLoading && !selectedForm && (
              <p className="text-sm text-slate-400">Loading feedback form…</p>
            )}

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

            {error && <p className="text-sm text-error">{error}</p>}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-slate-100 p-6">
        <button
          onClick={onClose}
          className="rounded-lg px-5 py-2.5 font-semibold text-slate-400 hover:bg-surface-hover"
        >
          Cancel
        </button>
        {!noFormsYet && (
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedFormId}
            className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Feedback"}
          </button>
        )}
      </div>
    </Modal>
  );
}