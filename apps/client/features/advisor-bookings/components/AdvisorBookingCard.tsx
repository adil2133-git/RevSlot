"use client";

import { useState } from "react";
import dayjs from "dayjs";
import type { AdvisorBookingItem, AdvisorBookingScope } from "../types";
import ReportDisputeModal from "./ReportDisputeModal";
import DisputeDetailsModal from "@/components/common/DisputeDetailsModal";

interface AdvisorBookingCardProps {
  booking: AdvisorBookingItem;
  activeTab?: AdvisorBookingScope;
  onActionClick?: (booking: AdvisorBookingItem) => void;
  onViewFeedback?: (booking: AdvisorBookingItem) => void;
  onDisputeUpdated?: () => void;
}

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const VideoIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 8-6 4 6 4V8Z" />
    <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
  </svg>
);

const FeedbackIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

export default function AdvisorBookingCard({
  booking,
  activeTab,
  onActionClick,
  onViewFeedback,
  onDisputeUpdated,
}: AdvisorBookingCardProps) {
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showDisputeDetailsModal, setShowDisputeDetailsModal] = useState(false);
  const formattedDate = dayjs(booking.startTime).format("ddd, D MMM YYYY");
  const formattedTime = `${dayjs(booking.startTime).format("h:mm A")} – ${dayjs(booking.endTime).format("h:mm A")} (${booking.timezone || "IST"})`;

  const now = dayjs();
  const startTime = dayjs(booking.startTime);
  const endTime = dayjs(booking.endTime);

  const isActive = booking.status === "confirmed" || booking.status === "rescheduled";
  const isJoinWindow = now.isAfter(startTime.subtract(15, "minute")) && now.isBefore(endTime);
  const isJoinAvailable = isActive && isJoinWindow && !!booking.meetLink; 

  const getPaymentBadge = () => {
    const isPaid = (booking.price && booking.price > 0) || (booking.paymentAmount && booking.paymentAmount > 0);
    const amount = booking.paymentAmount ? booking.paymentAmount / 100 : (booking.price || 0);

    if (!isPaid) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
          Free
        </span>
      );
    }

    if (booking.status === "cancelled") {
      const refundAmt = booking.refundAmount != null ? booking.refundAmount / 100 : amount;
      const feeAmt = booking.cancellationFee != null ? booking.cancellationFee / 100 : 0;
      if (refundAmt === 0 && feeAmt > 0) {
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800 border border-rose-200">
            <span>Non-Refundable (₹0 refund)</span>
          </span>
        );
      }
      if (feeAmt > 0) {
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
            <span>Refunded ₹{refundAmt}</span>
            <span className="text-[10px] text-amber-700 font-normal">(-₹{feeAmt} fee)</span>
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
          <span>Refunded ₹{refundAmt}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
        <svg className="w-3 h-3 text-emerald-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        <span>Paid ₹{amount}</span>
      </span>
    );
  };

  const getStatusBadge = () => {
    switch (booking.status) {
      case "confirmed":
        return <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-[#003366]">Upcoming</span>;
      case "completed":
        return <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Completed</span>;
      case "cancelled":
        return <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">Cancelled</span>;
      case "rescheduled":
        return <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">Rescheduled</span>;
      case "reschedule_requested":
        return <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">Reschedule Requested</span>;
      default:
        return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{booking.status}</span>;
    }
  };

  const slotCode = `#RS-${booking.slotId || (booking.id + 9420)}`;
  const isPaidSession = (booking.price && booking.price > 0) || (booking.paymentAmount && booking.paymentAmount > 0);
  const sessionAmount = booking.paymentAmount ? booking.paymentAmount / 100 : (booking.price || 0);

  return (
    <div className="group rounded-xl border border-slate-200 bg-surface-card p-5 shadow-surface transition-all hover:border-slate-300">
      {/* Top Line: Date/Time + Payment Badge & Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
          <CalendarIcon />
          <span>{formattedDate} • {formattedTime}</span>
        </div>
        <div className="flex items-center gap-2">
          {getPaymentBadge()}
          {getStatusBadge()}
        </div>
      </div>

      {/* Middle Section: Intern details + Reviewer + Payment details */}
      <div className="py-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">{booking.internName}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                Batch: {booking.batch}
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                Stage: {booking.weekStage}
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 font-medium text-blue-700 border border-blue-100">
                {booking.eventTypeName}
              </span>
              {booking.rescheduleCount && booking.rescheduleCount > 0 ? (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 border border-amber-200/60">
                    Rescheduled ({booking.rescheduleCount}/1)
                  </span>
                </>
              ) : null}
            </div>
          </div>
          <span className="shrink-0 text-xs font-medium text-slate-400">{slotCode}</span>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
          <UserIcon />
          <span>Reviewer: <strong className="font-semibold text-slate-800">{booking.reviewerName}</strong></span>
        </div>

        {/* Payment Receipt / Info Row */}
        {isPaidSession && booking.status !== "cancelled" && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700 border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">💳</span>
              <span className="font-semibold text-slate-800">Paid ₹{sessionAmount}</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 font-medium">Payment Verified</span>
            </div>
            {booking.razorpayPaymentId && (
              <span className="font-mono text-[10px] text-slate-400">Payment ID: {booking.razorpayPaymentId}</span>
            )}
          </div>
        )}

        {/* Refund Status Banner for Cancelled Paid Sessions */}
        {isPaidSession && booking.status === "cancelled" && (
          <div
            className={`mt-3 rounded-lg border p-3 text-xs space-y-1 ${
              (booking.refundAmount ?? 0) === 0 && (booking.cancellationFee ?? 0) > 0
                ? "border-amber-200 bg-amber-50/80 text-amber-950"
                : "border-emerald-200 bg-emerald-50/70 text-emerald-950"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-slate-900">
                <span>💰</span>
                {(booking.refundAmount ?? 0) === 0 && (booking.cancellationFee ?? 0) > 0
                  ? "Non-Refundable Cancellation"
                  : booking.cancellationFee && booking.cancellationFee > 0
                  ? "Partial Refund Processed"
                  : "Full 100% Refund Processed"}
              </span>
              <span className="font-bold text-slate-900">
                ₹{booking.refundAmount != null ? booking.refundAmount / 100 : sessionAmount}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              {(booking.refundAmount ?? 0) === 0 && (booking.cancellationFee ?? 0) > 0
                ? `This session was already rescheduled once and was cancelled as non-refundable. Your payment of ₹${sessionAmount} was transferred to reviewer ${booking.reviewerName} as compensation.`
                : booking.cancellationFee && booking.cancellationFee > 0
                ? `₹${booking.refundAmount ? booking.refundAmount / 100 : sessionAmount} refunded to source payment method. A 15% cancellation fee (₹${booking.cancellationFee / 100}) was retained per cancellation policy.`
                : `Full refund of ₹${booking.refundAmount ? booking.refundAmount / 100 : sessionAmount} initiated back to your original payment method via Razorpay.`}
            </p>
          </div>
        )}

        {booking.status === "reschedule_requested" && booking.proposedStartTime && (
          <div className="mt-3 rounded-lg bg-purple-50 p-3 text-xs text-purple-900 border border-purple-200 space-y-1">
            <p className="font-semibold">Reviewer Requested Reschedule to:</p>
            <p className="text-purple-800 font-bold">
              {dayjs(booking.proposedStartTime).format("ddd, MMM D, YYYY")} at {dayjs(booking.proposedStartTime).format("h:mm A")} – {dayjs(booking.proposedEndTime).format("h:mm A")}
            </p>
            {booking.rescheduleReason && <p className="text-purple-700 italic font-normal">"{booking.rescheduleReason}"</p>}
          </div>
        )}

        {booking.status === "cancelled" && booking.cancelledReason && (
          <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-100">
            <strong>Cancelled Reason:</strong> {booking.cancelledReason}
          </div>
        )}
      </div>

      {/* Bottom Actions Row — Context Aware */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-100">
        {activeTab === "upcoming" && (
          <>
            {booking.status === "reschedule_requested" && booking.rescheduleToken ? (
              <a
                href={`/reschedule-request/${booking.rescheduleToken}`}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-purple-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-800"
              >
                <span>Respond to Reschedule Request</span>
              </a>
          ) : isJoinAvailable && booking.meetLink ? (
              <a
               href={`${booking.meetLink}${
                    booking.meetLink.includes("?")
                    ? "&"
                    : "?"
              }source=advisor`}
               target="_blank"
               rel="noopener noreferrer"
               className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-on-primary shadow-sm transition hover:bg-primary/90"
              >
             <VideoIcon />
             <span>Join Meet</span>
             </a>
          ) : isActive && now.isBefore(startTime.subtract(15, "minute")) ? (
             <button
                type="button"
                disabled
                title="Meeting link will activate 15 minutes before the session starts"
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-400 cursor-not-allowed"
              >
                <VideoIcon />
                <span>Join Meet (Opens 15m before)</span>
              </button>
          ) : (
             <button
                type="button"
                disabled
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-400 cursor-not-allowed"
              >
                <VideoIcon />
                <span>No Link Available</span>
              </button>
            )}

            {booking.status !== "reschedule_requested" && (
              <button
                type="button"
                onClick={() => onActionClick?.(booking)}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition"
              >
                Reschedule / Cancel
              </button>
            )}
          </>
        )}

        {activeTab === "past" && (
          <>
            {booking.hasFeedback ? (
              <button
                type="button"
                onClick={() => onViewFeedback?.(booking)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#003366] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#003366]/90"
              >
                <FeedbackIcon />
                <span>View Feedback</span>
              </button>
            ) : (
              <div className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-4 py-2.5 text-xs font-medium text-slate-500 border border-slate-200">
                <span>Feedback Pending</span>
                <span className="text-slate-400">⏳</span>
              </div>
            )}
          </>
        )}

        {activeTab === "cancelled" && (
          <div className="w-full inline-flex items-center justify-center rounded-lg bg-red-50/50 px-4 py-2 text-xs font-medium text-red-600 border border-red-100">
            Session Cancelled
          </div>
        )}
      </div>

      {booking.dispute ? (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs">⚠️</span>
            {booking.dispute.status === "under_review" && (
              <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                Dispute Under Review
              </span>
            )}
            {booking.dispute.status === "resolved_refunded" && (
              <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                Dispute Resolved • Refund Issued
              </span>
            )}
            {booking.dispute.status === "resolved_dismissed" && (
              <span className="font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                Dispute Dismissed
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowDisputeDetailsModal(true)}
            className="text-primary hover:text-primary/80 font-semibold hover:underline"
          >
            View Details
          </button>
        </div>
      ) : (
        booking.status !== "cancelled" &&
        dayjs().isAfter(dayjs(booking.startTime)) &&
        dayjs().diff(dayjs(booking.endTime), "hour", true) <= 48 && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Encountered an issue with this session?</span>
            <button
              type="button"
              onClick={() => setShowDisputeModal(true)}
              className="text-rose-600 hover:text-rose-700 font-semibold hover:underline flex items-center gap-1"
            >
              <span>⚠️</span> Report No-Show / Issue
            </button>
          </div>
        )
      )}

      <ReportDisputeModal
        booking={booking}
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        onSuccess={onDisputeUpdated}
      />

      <DisputeDetailsModal
        isOpen={showDisputeDetailsModal}
        onClose={() => setShowDisputeDetailsModal(false)}
        dispute={booking.dispute || null}
        bookingInfo={{
          id: booking.id,
          eventTypeName: booking.eventTypeName,
          reviewerName: booking.reviewerName,
          startTime: booking.startTime,
        }}
        viewerRole="advisor"
      />
    </div>
  );
}
