"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { advisorApi } from "../services/advisorApi";
import type { AdvisorFeedbackData } from "../types";

interface AdvisorFeedbackModalProps {
  bookingId: number;
  onClose: () => void;
}

const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function AdvisorFeedbackModal({ bookingId, onClose }: AdvisorFeedbackModalProps) {
  const [data, setData] = useState<AdvisorFeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await advisorApi.getBookingFeedback(bookingId);
        setData(res);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || "Failed to load feedback details");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [bookingId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              <StarIcon /> Session Feedback
            </span>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              {data ? data.booking.eventTypeName : `Booking #${bookingId}`}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 text-center text-xs font-medium text-slate-400">
            Loading session feedback…
          </div>
        ) : error ? (
          <div className="py-8 text-center text-xs font-medium text-red-600">
            {error}
          </div>
        ) : data ? (
          <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Session Metadata Header */}
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block">Intern</span>
                  <strong className="font-bold text-slate-800 text-sm">{data.booking.internName}</strong>
                  <span className="text-slate-500 block">Batch: {data.booking.batch}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Reviewer</span>
                  <strong className="font-bold text-slate-800 text-sm">{data.booking.reviewerName}</strong>
                  <span className="text-slate-500 block">Stage: {data.booking.weekStage}</span>
                </div>
              </div>
            </div>

            {/* No-Show Alert */}
            {data.feedback.isNoShow && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800">
                <strong>Marked as No-Show:</strong> The intern did not attend this scheduled session.
              </div>
            )}

            {/* Marks & Understanding Level */}
            {!data.feedback.isNoShow && (
              <div className="grid grid-cols-3 gap-3 text-center">
                {data.feedback.reviewMark !== undefined && data.feedback.reviewMark !== null && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Review Score</span>
                    <span className="text-xl font-bold text-primary mt-0.5 block">{data.feedback.reviewMark}</span>
                  </div>
                )}

                {data.feedback.taskMark !== undefined && data.feedback.taskMark !== null && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Task Score</span>
                    <span className="text-xl font-bold text-emerald-600 mt-0.5 block">{data.feedback.taskMark}</span>
                  </div>
                )}

                {data.feedback.understandingLevel && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Understanding</span>
                    <span className="text-xs font-bold text-slate-700 mt-1.5 block capitalize">
                      {data.feedback.understandingLevel.replace("_", " ")}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Reviewer Comments */}
            {data.feedback.comments && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="text-xs font-semibold text-slate-700 mb-2">Reviewer Notes & Feedback</h4>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                  &ldquo;{data.feedback.comments}&rdquo;
                </p>
              </div>
            )}

            {/* Custom Field Responses */}
            {data.feedback.customFieldValues && Object.keys(data.feedback.customFieldValues).length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <h4 className="text-xs font-semibold text-slate-700">Detailed Evaluation</h4>
                {Object.entries(data.feedback.customFieldValues).map(([key, field]) => (
                  <div key={key} className="text-xs border-b border-slate-100 pb-2 last:border-b-0">
                    <span className="text-slate-500 font-medium block">{field.label}</span>
                    <span className="text-slate-800 font-semibold block mt-0.5">{field.value || "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
