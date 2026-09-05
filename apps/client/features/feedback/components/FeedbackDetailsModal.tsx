"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/common/Modal";
import { XIcon } from "@/features/booking/components/icons";
import { getFeedback, updateFeedback } from "../api/feedbackApi";
import { formatBookingDate } from "@/features/booking/utils/bookingDisplay";
import type { FeedbackDetails } from "../types";

interface FeedbackDetailsModalProps {
  bookingId: number;
  onClose: () => void;
}

// Mirrors SubmitFeedbackModal's mark options — 1.0–10.0 in half-point
// steps, per the backend's Submit/UpdateFeedbackSchema (multipleOf 0.5).
const MARK_OPTIONS = Array.from({ length: 19 }, (_, i) => (1 + i * 0.5).toFixed(1));

export default function FeedbackDetailsModal({ bookingId, onClose }: FeedbackDetailsModalProps) {
  const [details, setDetails] = useState<FeedbackDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<"view" | "edit">("view");
  const [reviewMark, setReviewMark] = useState("");
  const [taskMark, setTaskMark] = useState("");
  const [comments, setComments] = useState("");
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadDetails = () => {
    setLoading(true);
    setError(null);
    return getFeedback(bookingId)
      .then(setDetails)
      .catch(() => setError("Failed to load feedback."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const startEdit = () => {
    if (!details) return;
    setReviewMark(details.reviewMark ?? "");
    setTaskMark(details.taskMark ?? "");
    setComments(details.comments ?? "");
    const values: Record<string, string> = {};
    for (const field of details.customFields) {
      values[String(field.id)] = field.value;
    }
    setCustomValues(values);
    setSaveError(null);
    setMode("edit");
  };

  const handleSave = async () => {
    setSaveError(null);
    if (!reviewMark || !taskMark) {
      setSaveError("Review mark and task mark are required.");
      return;
    }

    setSaving(true);
    try {
      await updateFeedback(bookingId, {
        reviewMark: Number(reviewMark),
        taskMark: Number(taskMark),
        comments: comments.trim() || undefined,
        customFieldValues: customValues,
      });
      await loadDetails();
      setMode("view");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to update feedback.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} widthClassName="max-w-lg">
      <div className="flex items-center justify-between border-b border-slate-100 p-6">
        <div>
          <h2 className="text-xl font-bold text-on-surface">
            {mode === "edit" ? "Edit Feedback" : "Feedback"}
          </h2>
          {details && (
            <p className="mt-0.5 text-sm text-slate-400">
              {details.clientName} · {details.eventTypeName}
            </p>
          )}
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
        {loading && <p className="text-sm text-slate-400">Loading feedback…</p>}

        {error && <p className="text-sm text-error">{error}</p>}

        {!loading && !error && !details && (
          <p className="text-sm text-slate-400">No feedback has been submitted for this booking yet.</p>
        )}

        {!loading && !error && details && mode === "view" && (
          <>
            <div>
              <p className="text-xs font-medium text-slate-400">
                {formatBookingDate(details.sessionDate)}
                {details.formName && <> · {details.formName}</>}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 bg-surface px-3.5 py-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Review mark
                </p>
                <p className="mt-0.5 text-lg font-bold text-on-surface">
                  {details.reviewMark ?? "—"}
                  <span className="text-sm font-medium text-slate-400"> / 10</span>
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-surface px-3.5 py-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Task mark
                </p>
                <p className="mt-0.5 text-lg font-bold text-on-surface">
                  {details.taskMark ?? "—"}
                  <span className="text-sm font-medium text-slate-400"> / 10</span>
                </p>
              </div>
            </div>

            {details.customFields.map((field) => (
              <div key={field.id}>
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                  {field.label}
                </p>
                <p className="text-sm text-on-surface">{field.value || "—"}</p>
              </div>
            ))}

            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                Comments
              </p>
              <p className="whitespace-pre-wrap text-sm text-on-surface">
                {details.comments || "No comments left."}
              </p>
            </div>

            <div className="border-t border-slate-100 pt-3 text-xs text-slate-400">
              Submitted {formatBookingDate(details.createdAt)}
              {details.updatedAt !== details.createdAt && (
                <> · Edited {formatBookingDate(details.updatedAt)}</>
              )}
            </div>

            {details.canEdit ? (
              <div className="flex items-center justify-between rounded-lg bg-secondary/40 px-3.5 py-2.5 text-xs text-primary">
                <span>You can edit this feedback until {formatBookingDate(details.editableUntil)}.</span>
                <button
                  type="button"
                  onClick={startEdit}
                  className="font-semibold underline hover:no-underline"
                >
                  Edit Feedback
                </button>
              </div>
            ) : (
              <p className="rounded-lg bg-slate-100 px-3.5 py-2.5 text-xs text-slate-500">
                🔒 Feedback is locked and can no longer be edited.
              </p>
            )}
          </>
        )}

        {!loading && !error && details && mode === "edit" && (
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
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-secondary/60"
              />
            </div>

            {details.customFields.map((field) => (
              <div key={field.id}>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                  {field.label}
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

            {saveError && <p className="text-sm text-error">{saveError}</p>}
          </>
        )}
      </div>

      {mode === "edit" && (
        <div className="flex justify-end gap-3 border-t border-slate-100 p-6">
          <button
            onClick={() => setMode("view")}
            className="rounded-lg px-5 py-2.5 font-semibold text-slate-400 hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </Modal>
  );
}