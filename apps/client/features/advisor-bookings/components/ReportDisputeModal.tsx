"use client";

import { useState } from "react";
import type { AdvisorBookingItem } from "../types";
import { reportBookingDispute } from "../api/disputeApi";

interface ReportDisputeModalProps {
  booking: AdvisorBookingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ReportDisputeModal({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: ReportDisputeModalProps) {
  const [reason, setReason] = useState<
    "reviewer_no_show" | "technical_issue" | "inadequate_review" | "other"
  >("reviewer_no_show");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Please provide a brief explanation of what occurred.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await reportBookingDispute({
        bookingId: booking.id,
        advisorEmail: booking.advisorEmail,
        reason,
        description: description.trim(),
      });

      setSuccess(true);
      onSuccess?.();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to submit report. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>⚠️</span> Report Session Issue / No-Show
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Session with <span className="font-semibold text-slate-700">{booking.reviewerName}</span> ({booking.eventTypeName})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="my-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="text-sm font-bold text-emerald-800">Report Submitted Successfully</p>
            <p className="mt-1 text-xs text-emerald-700">
              Session payment has been frozen in clearance. Our team will review attendance logs and get back to you.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Report
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-primary bg-white"
              >
                <option value="reviewer_no_show">Reviewer Did Not Join (No-Show)</option>
                <option value="technical_issue">Technical / Audio / Video Room Issue</option>
                <option value="inadequate_review">Inadequate / Incomplete Review Session</option>
                <option value="other">Other Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Details & Description
              </label>
              <textarea
                rows={3}
                required
                placeholder="Explain what happened (e.g., 'We waited in the Google Meet for 20 minutes but the reviewer never joined')..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 flex items-start gap-2">
              <span className="text-amber-600 font-bold">ℹ️</span>
              <p className="leading-relaxed">
                Submitting this report immediately <strong>freezes the reviewer&apos;s earnings</strong> from maturing. RevSlot investigates room attendance timestamps, and if verified, a 100% full refund is issued back to your original payment method.
              </p>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs font-medium text-red-700">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition shadow-xs"
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
