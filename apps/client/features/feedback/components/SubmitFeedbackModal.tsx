"use client";

import { useEffect, useState, type ReactNode } from "react";
import Modal from "@/components/common/Modal";
import { XIcon } from "@/features/booking/components/icons";
import { useFeedbackStore } from "../store/feedbackStore";
import { submitFeedback } from "../api/feedbackApi";
import type { MyBooking } from "@/features/booking/type";
import type { UnderstandingLevel } from "../types";

type FeedbackBookingSummary = Pick<MyBooking, "id" | "internName" | "advisorName" | "eventTypeName">;

interface SubmitFeedbackModalProps {
  booking: FeedbackBookingSummary;
  onClose: () => void;
  onSubmitted: () => void;
}

const MARK_OPTIONS = Array.from({ length: 19 }, (_, i) => (1 + i * 0.5).toFixed(1));

const UNDERSTANDING_LEVELS: { value: UnderstandingLevel; label: string }[] = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "average", label: "Average" },
  { value: "needs_improvement", label: "Needs Improvement" },
];

export default function SubmitFeedbackModal({ booking, onClose, onSubmitted }: SubmitFeedbackModalProps) {
  const { forms, selectedForm, isLoading, fetchForms, fetchForm, clearSelectedForm } = useFeedbackStore();

  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  const [isNoShow, setIsNoShow] = useState(false);
  const [reviewMark, setReviewMark] = useState("");
  const [understandingLevel, setUnderstandingLevel] = useState<UnderstandingLevel | "">("");
  const [taskMark, setTaskMark] = useState("");
  const [comments, setComments] = useState("");
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the reviewer's form library once when the modal opens.
  useEffect(() => {
    fetchForms();
    return () => clearSelectedForm();
  }, []);

  useEffect(() => {
    if (forms.length === 0 || selectedFormId !== null) return;
    const preferred = forms.find((f) => f.isDefault) ?? forms[0];
    handleSelectForm(preferred.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forms]);

    const handleSelectForm = (formId: number) => {
    setSelectedFormId(formId);
    setReviewMark("");
    setUnderstandingLevel("");
    setTaskMark("");
    setComments("");
    setCustomValues({});
    setIsNoShow(false);
    setError(null);
    fetchForm(formId);
  };

    const handleSubmit = async () => {
    setError(null);

    if (!selectedFormId) return setError("Please choose a feedback form.");

    if (!isNoShow) {
      if (!reviewMark) return setError("Review mark is required.");

      if (!understandingLevel) {
        return setError("Understanding level is required.");
      }

      if (selectedForm?.taskMarkEnabled && !taskMark) {
        return setError("Task mark is required for this form.");
      }

      for (const field of selectedForm?.fields ?? []) {
        if (
          field.required &&
          !customValues[String(field.id)]?.trim()
        ) {
          return setError(`"${field.label}" is required.`);
        }
      }
    }

    setSubmitting(true);

    try {
      await submitFeedback(booking.id, {
        formId: selectedFormId,
        isNoShow,
        reviewMark: isNoShow ? undefined : Number(reviewMark),
        understandingLevel: isNoShow
          ? undefined
          : understandingLevel || undefined,
        taskMark:
          isNoShow ||
          !selectedForm?.taskMarkEnabled ||
          !taskMark
            ? undefined
            : Number(taskMark),
        comments: isNoShow ? undefined : comments.trim() || undefined,
        customFieldValues: isNoShow ? {} : customValues,
      });
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
        {label} {required && <span className="text-error">*</span>}
      </label>

      {children}
    </div>
  );
}

function CustomField({
  field,
  disabled,
  value,
  onChange,
}: {
  field: {
    id: number;
    label: string;
    fieldType: "text" | "textarea" | "number" | "select";
    options: string[] | null;
    required: boolean;
  };
  disabled: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={field.label} required={field.required}>
      {field.fieldType === "textarea" ? (
        <textarea
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="input resize-none"
        />
      ) : field.fieldType === "select" ? (
        <select
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input"
        >
          <option value="">Select an option</option>

          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          disabled={disabled}
          type={field.fieldType === "number" ? "number" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input"
        />
      )}
    </Field>
  );
}

  const showPicker = forms.length > 1;
  const noFormsYet = !isLoading && forms.length === 0;

    return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-slate-100 p-6">
        <div>
          <h2 className="text-xl font-bold text-on-surface">
            Leave Feedback
          </h2>

          <p className="mt-0.5 text-sm text-slate-400">
            {booking.internName || booking.advisorName} · {booking.eventTypeName}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-surface-hover hover:text-on-surface"
          aria-label="Close"
        >
          <XIcon />
        </button>
      </div>

      {noFormsYet ? (
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
      ) : (
        <div
          className={`flex max-h-[70vh] ${
            showPicker ? "divide-x divide-slate-100" : ""
          }`}
        >
          {/* FORM PICKER */}
          {showPicker && (
            <div className="w-52 shrink-0 overflow-y-auto p-4">
              <p className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Feedback Forms
              </p>

              <div className="space-y-1">
                {forms.map((form) => (
                  <button
                    key={form.id}
                    type="button"
                    onClick={() => handleSelectForm(form.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                      selectedFormId === form.id
                        ? "bg-secondary text-primary"
                        : "text-slate-600 hover:bg-surface-hover"
                    }`}
                  >
                    {form.isDefault && (
                      <span
                        className="shrink-0"
                        title="Default form"
                      >
                        ⭐
                      </span>
                    )}

                    <span className="truncate">{form.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* FORM CONTENT */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading && !selectedForm ? (
              <p className="text-sm text-slate-400">
                Loading feedback form…
              </p>
            ) : selectedForm ? (
              <div className="space-y-6">
                {/* SELECTED FORM HEADER */}
                <div>
                  <h3 className="text-base font-bold text-on-surface">
                    {selectedForm.name}
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Complete the feedback for this session.
                  </p>
                </div>

                {/* NO SHOW */}
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-3 text-sm font-medium text-on-surface">
                  <input
                    type="checkbox"
                    checked={isNoShow}
                    onChange={(e) => {
                      setIsNoShow(e.target.checked);

                      if (e.target.checked) {
                        setReviewMark("");
                        setUnderstandingLevel("");
                        setTaskMark("");
                        setCustomValues({});
                      }
                    }}
                    className="h-4 w-4 rounded border-slate-300"
                  />

                  <span>Mark as no-show</span>
                </label>

                {!isNoShow && (
                  <>
                    {/* STANDARD MARKS */}
                    <div
                      className={`grid gap-4 ${
                        selectedForm.taskMarkEnabled
                          ? "grid-cols-1 sm:grid-cols-3"
                          : "grid-cols-1 sm:grid-cols-2"
                      }`}
                    >
                      <Field label="Review Mark" required>
                        <select
                          value={reviewMark}
                          onChange={(e) => setReviewMark(e.target.value)}
                          className="input w-full"
                        >
                          <option value="">Select mark</option>

                          {MARK_OPTIONS.map((mark) => (
                            <option key={mark} value={mark}>
                              {mark}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Understanding Level" required>
                        <select
                          value={understandingLevel}
                          onChange={(e) =>
                            setUnderstandingLevel(
                              e.target.value as UnderstandingLevel
                            )
                          }
                          className="input w-full"
                        >
                          <option value="">Select level</option>

                          {UNDERSTANDING_LEVELS.map((level) => (
                            <option
                              key={level.value}
                              value={level.value}
                            >
                              {level.label}
                            </option>
                          ))}
                        </select>
                      </Field>

                      {selectedForm.taskMarkEnabled && (
                        <Field label="Task Mark" required>
                          <select
                            value={taskMark}
                            onChange={(e) =>
                              setTaskMark(e.target.value)
                            }
                            className="input w-full"
                          >
                            <option value="">Select mark</option>

                            {MARK_OPTIONS.map((mark) => (
                              <option key={mark} value={mark}>
                                {mark}
                              </option>
                            ))}
                          </select>
                        </Field>
                      )}
                    </div>

                    {/* ATTACHED QUESTION BANK QUESTIONS */}
                    {selectedForm.questions.length > 0 && (
                      <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                        <div className="mb-4">
                          <h4 className="text-sm font-bold text-on-surface">
                            Review Questions
                          </h4>

                          <p className="mt-1 text-xs text-slate-400">
                            Questions attached to this feedback form.
                          </p>
                        </div>

                        <div className="space-y-3">
                          {selectedForm.questions.map((question, index) => (
                            <div
                              key={question.id}
                              className="rounded-lg border border-slate-200 bg-white p-3.5"
                            >
                              <div className="flex gap-3">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">
                                  {index + 1}
                                </span>

                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-on-surface">
                                    {question.questionText}
                                  </p>

                                  {question.description && (
                                    <p className="mt-1 text-xs leading-5 text-slate-400">
                                      {question.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* CUSTOM FORM FIELDS */}
                    {selectedForm.fields.length > 0 && (
                      <section className="space-y-4">
                        <div>
                          <h4 className="text-sm font-bold text-on-surface">
                            Additional Feedback
                          </h4>

                          <p className="mt-1 text-xs text-slate-400">
                            Complete the additional fields configured for
                            this form.
                          </p>
                        </div>

                        {selectedForm.fields.map((field) => (
                          <CustomField
                            key={field.id}
                            field={field}
                            disabled={submitting}
                            value={
                              customValues[String(field.id)] ?? ""
                            }
                            onChange={(value) =>
                              setCustomValues((prev) => ({
                                ...prev,
                                [String(field.id)]: value,
                              }))
                            }
                          />
                        ))}
                      </section>
                    )}
                  </>
                )}

                {/* COMMENTS */}
                <Field label="Comments">
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={4}
                    disabled={submitting}
                    placeholder="Notes for this session"
                    className="input w-full resize-none"
                  />
                </Field>

                {/* ERROR */}
                {error && (
                  <div
                    role="alert"
                    className="rounded-lg border border-error/20 bg-error/5 px-3.5 py-3 text-sm text-error"
                  >
                    {error}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                Select a feedback form to continue.
              </p>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="flex justify-end gap-3 border-t border-slate-100 p-6">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-5 py-2.5 font-semibold text-slate-400 hover:bg-surface-hover"
        >
          Cancel
        </button>

        {!noFormsYet && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !selectedFormId || isLoading}
            className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Feedback"}
          </button>
        )}
      </div>
    </Modal>
  );
    
}




