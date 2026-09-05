import { useEffect, useState } from "react";
import { MailIcon, CalendarIcon, ClockIcon, CheckCircleIcon, UserXIcon, } from "./icons";
import StatusBadge from "./StatusBadge";
import BookingActionsMenu from "./BookingActionsMenu";
import { initials, formatBookingDate, formatBookingTimeRange } from "../utils/bookingDisplay";
import type { MyBooking } from "../type";

interface BookingCardProps {
  booking: MyBooking;
  onViewDetails?: (booking: MyBooking) => void;
  onCancel?: (booking: MyBooking) => void;
  onReschedule?: (booking: MyBooking) => void;
  onMarkCompleted?: (booking: MyBooking) => void;
  onMarkNoShow?: (booking: MyBooking) => void;
  onLeaveFeedback?: (booking: MyBooking) => void;
  onViewFeedback?: (booking: MyBooking) => void;
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));

  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor(
    (totalSeconds % (24 * 60 * 60)) / (60 * 60)
  );
  const minutes = Math.floor(
    (totalSeconds % (60 * 60)) / 60
  );
  const seconds = totalSeconds % 60;
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${seconds}s`;
}


export default function BookingCard({
  booking,
  onViewDetails,
  onCancel,
  onReschedule,
  onMarkCompleted,
  onMarkNoShow,
  onLeaveFeedback,
  onViewFeedback,
}: BookingCardProps) {

  const displayName = booking.internName || booking.advisorName;
  const [, forceTick] = useState(0);
  const [outcomeToConfirm, setOutcomeToConfirm] = useState<
  "completed" | "no_show" | null
>(null);
  const [isChangeOutcomeOpen, setIsChangeOutcomeOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
    forceTick((t) => t + 1);
  }, 30 * 1000);

  return () => clearInterval(id);
}, []);

  const now = Date.now();
  const startTime = new Date(booking.startTime).getTime();
  const endTime = new Date(booking.endTime).getTime();
  const graceEnd = startTime + 10 * 60 * 1000;

  const isActiveBooking =
    booking.status === "confirmed" || booking.status === "rescheduled";

  const isInProgress =
    isActiveBooking && now >= startTime && now < endTime;

  const isOutcomeRequired =
    isActiveBooking && now >= endTime;

  const canMarkNoShow =
    isActiveBooking && now >= graceEnd;

  const isCompleted = booking.status === "completed";
  const isNoShow = booking.status === "no_show";

  const isUpcoming = isActiveBooking && now < startTime;
  const msUntilStart = startTime - now;
  const isJoinAvailable = isActiveBooking && now >= startTime - 10 * 60 * 1000 && now < endTime;
  const isUrgent = isUpcoming && msUntilStart <= 10 * 60 * 1000; // last 10 minutes

  const statusBorderColor = isOutcomeRequired
    ? "border-l-orange-500"
    : isInProgress
    ? "border-l-blue-500"
    : booking.status === "confirmed"
    ? "border-l-emerald-500"
    : booking.status === "rescheduled"
    ? "border-l-amber-500"
    : booking.status === "no_show" || booking.status === "cancelled"
    ? "border-l-rose-500"
    : "border-l-slate-300"; // completed

  return (
    <div
      className={`flex flex-col gap-4 rounded-xl border border-slate-200/80 border-l-4 ${statusBorderColor} bg-surface-card p-4 sm:p-5 shadow-surface transition-all hover:border-slate-300 hover:shadow-raised md:flex-row md:items-center md:justify-between`}
    >
      {/* Left Info: Avatar + Intern Name + Event Type + Advisor */}
      <div className="flex items-start gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary font-bold text-sm border border-primary/15 shadow-2xs">
          {initials(displayName)}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-on-surface text-base">{displayName}</span>
            {booking.batch && (
              <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-primary">
                {booking.batch}
              </span>
            )}
            {booking.eventTypeName && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {booking.eventTypeName}
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            {booking.weekStage && (
              <span className="font-medium text-slate-700">{booking.weekStage}</span>
            )}
            {booking.advisorName && (
              <span>
                Advisor: <strong className="font-medium text-slate-700">{booking.advisorName}</strong>
              </span>
            )}
            <div className="flex items-center gap-1">
              <MailIcon className="text-slate-400" />
              <span>{booking.advisorEmail}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Date & Time */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-surface px-3 py-1.5 text-xs font-semibold text-slate-700">
          <CalendarIcon className="text-slate-400" />
          <span>{formatBookingDate(booking.startTime)}</span>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-surface px-3 py-1.5 text-xs font-semibold text-slate-700">
          <ClockIcon className="text-slate-400" />
          <span>{formatBookingTimeRange(booking.startTime, booking.endTime)}</span>
        </div>
      </div>

      {/* Right Actions & Status */}
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0">
        {!isOutcomeRequired && (
          <StatusBadge
            status={isInProgress ? "in_progress" : booking.status}
          />
        )}

        <div className="flex items-center gap-2">

         {isOutcomeRequired && onMarkCompleted && (
          <button
            type="button"
            onClick={() =>  setOutcomeToConfirm("completed")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
          >
           <CheckCircleIcon />
              Mark as completed
           </button>
          )}

        {canMarkNoShow && onMarkNoShow && (
          <button
            type="button"
            onClick={() => setOutcomeToConfirm("no_show")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
          >
           <UserXIcon />
              Mark as no-show
           </button>
          )}

          {isCompleted && !booking.hasFeedback && onLeaveFeedback && (
            <button
              type="button"
              onClick={() => onLeaveFeedback(booking)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-secondary px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              Leave Feedback
            </button>
          )}

          {isCompleted && booking.hasFeedback && onViewFeedback && (
            <button
              type="button"
              onClick={() => onViewFeedback(booking)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-3 py-1.5 text-xs font-semibold text-on-surface transition-colors hover:bg-surface-hover"
            >
              View Feedback
            </button>
          )}

          {isNoShow && (
            <span className="text-xs font-medium text-slate-400">
              No feedback available
            </span>
          )}
            
          {booking.meetLink && isActiveBooking && now < endTime && (
              <div className="flex items-center gap-2">
                {isUpcoming ? (
                  <span
                    className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                      isUrgent
                        ? "animate-pulse border-rose-200 bg-rose-50 text-rose-600"
                        : "border-slate-200 bg-surface text-slate-500"
                    }`}
                  >
                    {isUrgent ? "🔴" : "🕐"} Starts in {formatCountdown(msUntilStart)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    🟢 Live now
                  </span>
                )}

            {isJoinAvailable ? (
                <a
                  href={booking.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary shadow-2xs hover:shadow-surface transition-shadow"
                 >
                 Join Meet
               </a>
              ) : (
           <span className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-primary/40 px-3 py-1.5 text-xs font-semibold text-on-primary/70">
              Join Meet
           </span>
           )}
       </div>
       )}
          <BookingActionsMenu
            booking={booking}
            onViewDetails={() => onViewDetails?.(booking)}
            onCancel={() => onCancel?.(booking)}
            onReschedule={() => onReschedule?.(booking)}
            onChangeOutcome={() => setIsChangeOutcomeOpen(true)}
            onViewFeedback={() => onViewFeedback?.(booking)}
          />
     </div>
   </div>

{outcomeToConfirm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="w-full max-w-md rounded-xl bg-surface-card p-6 shadow-raised">
      <h2 className="text-lg font-bold text-on-surface">
        {outcomeToConfirm === "completed"
          ? "Mark session as completed?"
          : "Mark booking as no-show?"}
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        {outcomeToConfirm === "completed"
          ? "This will mark the session as completed and allow feedback to be submitted."
          : "This will mark the booking as no-show and feedback will not be available for this booking."}
      </p>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setOutcomeToConfirm(null)}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-surface-hover"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() => {
            if (outcomeToConfirm === "completed") {
              onMarkCompleted?.(booking);
            } else {
              onMarkNoShow?.(booking);
            }

            setOutcomeToConfirm(null);
          }}
          className={
            outcomeToConfirm === "completed"
              ? "rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              : "rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          }
        >
          {outcomeToConfirm === "completed"
            ? "Mark Completed"
            : "Mark No-show"}
        </button>
      </div>
    </div>
  </div>
)}

{isChangeOutcomeOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="w-full max-w-md rounded-xl bg-surface-card p-6 shadow-raised">
      <h2 className="text-lg font-bold text-on-surface">
        Change booking outcome
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        Select the correct outcome for this booking.
      </p>

       <div className="mt-5 space-y-2">
  {booking.status === "no_show" && (
    <button
      type="button"
      onClick={() => {
        setIsChangeOutcomeOpen(false);
        setOutcomeToConfirm("completed");
      }}
      className="flex w-full items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-on-surface hover:bg-surface-hover"
    >
      <CheckCircleIcon />
      Completed
    </button>
  )}

  {booking.status === "completed" && !booking.hasFeedback && (
    <button
      type="button"
      onClick={() => {
        setIsChangeOutcomeOpen(false);
        setOutcomeToConfirm("no_show");
      }}
      className="flex w-full items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-on-surface hover:bg-surface-hover"
    >
      <UserXIcon />
      No-show
    </button>
  )}
</div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={() => setIsChangeOutcomeOpen(false)}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-surface-hover"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
  </div>
);
};