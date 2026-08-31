"use client";

import React, { useEffect, useState } from "react";
import { fetchReferenceQuestions } from "../api/dashboardApi";
import type { ReferenceQuestionsData } from "../type";

interface ReferenceQuestionsDrawerProps {
  isOpen: boolean;
  bookingId: number | null;
  onClose: () => void;
}

export const ReferenceQuestionsDrawer: React.FC<ReferenceQuestionsDrawerProps> = ({
  isOpen,
  bookingId,
  onClose,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<ReferenceQuestionsData | null>(null);
  const [checkedState, setCheckedState] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (isOpen && bookingId) {
      setLoading(true);
      fetchReferenceQuestions(bookingId)
        .then((res) => {
          setData(res);
        })
        .catch((err) => {
          console.error("Failed to load reference questions:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setData(null);
      setCheckedState({});
    }
  }, [isOpen, bookingId]);

  if (!isOpen) return null;

  const toggleCheck = (id: number) => {
    setCheckedState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const questionsList = data?.questionBank?.questions || [];
  const sectionTitle = data?.questionBank?.name
    ? data.questionBank.name.toUpperCase()
    : data?.booking?.weekStage?.toUpperCase() || "REFERENCE QUESTIONS";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs transition-opacity">
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-surface-card shadow-xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-bold text-on-surface">Reference Questions</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-primary" />
                <span className="mt-3 text-xs text-slate-500">Loading questions...</span>
              </div>
            ) : questionsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-on-surface">No questions found</h3>
                <p className="mt-1 text-xs text-slate-500">
                  No reference question bank linked to this event type yet.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* Section Subheader */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {sectionTitle}
                  </span>
                </div>

                {/* Questions List */}
                <div className="flex flex-col gap-3">
                  {questionsList.map((q) => {
                    const isChecked = !!checkedState[q.id];

                    return (
                      <label
                        key={q.id}
                        onClick={() => toggleCheck(q.id)}
                        className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-all ${
                          isChecked
                            ? "border-primary bg-secondary/40 shadow-2xs"
                            : "border-slate-200 bg-surface-card hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${isChecked ? "text-primary" : "text-on-surface"}`}>
                            {q.questionText}
                          </span>
                          {q.description && (
                            <p className="mt-1 text-xs leading-relaxed text-slate-500">
                              {q.description}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Bottom Notice Callout */}
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-secondary/50 p-4 text-xs text-primary">
                  <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-primary font-bold">
                    i
                  </div>
                  <p className="leading-relaxed">
                    Remember to submit final scores in the academic portal within 24 hours of session completion.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="border-t border-slate-200 p-6 bg-surface">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-on-primary shadow-surface hover:shadow-raised transition-all"
            >
              Done
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
