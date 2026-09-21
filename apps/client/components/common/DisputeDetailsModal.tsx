"use client";

import React from "react";
import dayjs from "dayjs";

export interface DisputeModalInfo {
  id?: number;
  bookingId?: number;
  reason: "reviewer_no_show" | "technical_issue" | "inadequate_review" | "other" | string;
  description: string;
  status: "under_review" | "resolved_refunded" | "resolved_dismissed" | string;
  adminNotes?: string | null;
  createdAt?: string | null;
  resolvedAt?: string | null;
}

interface DisputeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispute: DisputeModalInfo | null;
  bookingInfo?: {
    id: number;
    eventTypeName: string;
    advisorName?: string;
    reviewerName?: string;
    startTime?: string;
  } | null;
  viewerRole?: "advisor" | "reviewer";
}

const REASON_LABELS: Record<string, string> = {
  reviewer_no_show: "Reviewer Did Not Join (No-Show)",
  technical_issue: "Technical / Video Room Issue",
  inadequate_review: "Inadequate / Incomplete Review Session",
  other: "Other Grievance",
};

export default function DisputeDetailsModal({
  isOpen,
  onClose,
  dispute,
  bookingInfo,
  viewerRole = "advisor",
}: DisputeDetailsModalProps) {
  if (!isOpen || !dispute) return null;

  const isResolved = dispute.status.startsWith("resolved");
  const isRefunded = dispute.status === "resolved_refunded";
  const isDismissed = dispute.status === "resolved_dismissed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Dispute & Resolution Details
              </h3>
            </div>
            {bookingInfo && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Booking #{bookingInfo.id} •{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {bookingInfo.eventTypeName}
                </span>
                {bookingInfo.reviewerName && viewerRole === "advisor" && (
                  <span> with {bookingInfo.reviewerName}</span>
                )}
                {bookingInfo.advisorName && viewerRole === "reviewer" && (
                  <span> filed by {bookingInfo.advisorName}</span>
                )}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg leading-none transition"
          >
            ✕
          </button>
        </div>

        {/* Status Pill */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Current Status
          </span>
          {dispute.status === "under_review" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Under Administrative Review
            </span>
          )}
          {isRefunded && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
              ✓ Resolved • 100% Refund Issued
            </span>
          )}
          {isDismissed && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
              ✓ Resolved • Dispute Dismissed
            </span>
          )}
        </div>

        {/* Dispute Overview Details */}
        <div className="mt-4 space-y-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3.5 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-500">Reported Grievance</span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              {REASON_LABELS[dispute.reason] || dispute.reason}
            </span>
          </div>

          {dispute.createdAt && (
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500">Date Reported</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {dayjs(dispute.createdAt).format("MMM D, YYYY [at] h:mm A")}
              </span>
            </div>
          )}

          {dispute.resolvedAt && (
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500">Date Resolved</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {dayjs(dispute.resolvedAt).format("MMM D, YYYY [at] h:mm A")}
              </span>
            </div>
          )}

          {/* Description */}
          <div className="pt-1">
            <span className="text-slate-500 block mb-1">Report Description & Notes:</span>
            <div className="rounded-lg bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 leading-relaxed whitespace-pre-wrap">
              {dispute.description || "No description provided."}
            </div>
          </div>
        </div>

        {/* Administration Resolution Notes (if available) */}
        {dispute.adminNotes && (
          <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 text-xs text-indigo-950 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-200">
            <p className="font-bold uppercase tracking-wider text-[11px] text-indigo-800 dark:text-indigo-300 mb-1">
              Admin Ruling & Findings:
            </p>
            <p className="leading-relaxed">{dispute.adminNotes}</p>
          </div>
        )}

        {/* Escrow Status explanation */}
        {!isResolved && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200 flex items-start gap-2">
            <span className="text-amber-600 font-bold shrink-0">ℹ️</span>
            {viewerRole === "reviewer" ? (
              <p className="leading-relaxed">
                Payout funds for this session are currently held in escrow. RevSlot Administration will audit the Google Meet attendance logs and chat records to confirm attendance before releasing or refunding the transaction.
              </p>
            ) : (
              <p className="leading-relaxed">
                Escrow funds have been frozen. RevSlot Administration is verifying meeting room access logs. If verified, a 100% full refund is issued back to your account.
              </p>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
