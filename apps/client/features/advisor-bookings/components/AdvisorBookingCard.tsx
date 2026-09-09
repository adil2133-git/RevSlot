"use client";

import dayjs from "dayjs";
import type { AdvisorBookingItem, AdvisorBookingScope } from "../types";

interface AdvisorBookingCardProps {
  booking: AdvisorBookingItem;
  activeTab?: AdvisorBookingScope;
  onActionClick?: (booking: AdvisorBookingItem) => void;
  onViewFeedback?: (booking: AdvisorBookingItem) => void;
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
  activeTab = "upcoming",
  onActionClick,
  onViewFeedback,
}: AdvisorBookingCardProps) {
  const formattedDate = dayjs(booking.startTime).format("ddd, MMM D");
  const formattedTime = `${dayjs(booking.startTime).format("h:mm A")} – ${dayjs(booking.endTime).format("h:mm A")} (${booking.timezone || "IST"})`;

  const getStatusBadge = () => {
    switch (booking.status) {
      case "confirmed":
        return <span className="rounded-full bg-[#e6eef5] px-3 py-1 text-xs font-medium text-[#003366]">Upcoming</span>;
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

  return (
    <div className="group rounded-xl border border-slate-200 bg-surface-card p-5 shadow-surface transition-all hover:border-slate-300">
      {/* Top Line: Date/Time + Status Badge */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
          <CalendarIcon />
          <span>{formattedDate} • {formattedTime}</span>
        </div>
        {getStatusBadge()}
      </div>

      {/* Middle Section: Intern details + Reviewer */}
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
            </div>
          </div>
          <span className="shrink-0 text-xs font-medium text-slate-400">{slotCode}</span>
        </div>

        <div className="mt-3.5 flex items-center gap-2 text-xs text-slate-600">
          <UserIcon />
          <span>Reviewer: <strong className="font-semibold text-slate-800">{booking.reviewerName}</strong></span>
        </div>

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
            ) : booking.meetLink && booking.status !== "cancelled" ? (
              <a
                href={booking.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-on-primary shadow-sm transition hover:bg-primary/90"
              >
                <VideoIcon />
                <span>Join Google Meet</span>
              </a>
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
    </div>
  );
}
