import { MailIcon, CalendarIcon, ClockIcon } from "./icons";
import StatusBadge from "./StatusBadge";
import BookingActionsMenu from "./BookingActionsMenu";
import { initials, formatBookingDate, formatBookingTimeRange } from "../utils/bookingDisplay";
import type { MyBooking } from "../type";

interface BookingCardProps {
  booking: MyBooking;
  onViewDetails?: (booking: MyBooking) => void;
  onCancel?: (booking: MyBooking) => void;
  onReschedule?: (booking: MyBooking) => void;
  onLeaveFeedback?: (booking: MyBooking) => void; 
}

export default function BookingCard({
  booking,
  onViewDetails,
  onCancel,
  onReschedule,
  onLeaveFeedback,
}: BookingCardProps) {
  const statusBorderColor =
    booking.status === "confirmed"
      ? "border-l-emerald-500"
      : booking.status === "rescheduled"
      ? "border-l-amber-500"
      : booking.status === "cancelled"
      ? "border-l-rose-500"
      : "border-l-slate-300";

  const displayName = booking.internName || booking.advisorName;

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
        <StatusBadge status={booking.status} />

        <div className="flex items-center gap-2">
          {booking.meetLink && (booking.status === "confirmed" || booking.status === "rescheduled") && (
            <a
              href={booking.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary shadow-2xs hover:shadow-surface transition-shadow"
            >
              Join Meet
            </a>
          )}

          <BookingActionsMenu
            booking={booking}
            onViewDetails={() => onViewDetails?.(booking)}
            onCancel={() => onCancel?.(booking)}
            onReschedule={() => onReschedule?.(booking)}
            onLeaveFeedback={() => onLeaveFeedback?.(booking)}
          />
        </div>
      </div>
    </div>
  );
}