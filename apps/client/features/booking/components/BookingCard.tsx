import { MailIcon, CalendarIcon, ClockIcon, ExternalLinkIcon } from "./icons";
import StatusBadge from "./StatusBadge";
import BookingActionsMenu from "./BookingActionsMenu";
import { initials, formatBookingDate, formatBookingTimeRange } from "../utils/bookingDisplay";
import type { MyBooking } from "../type";

interface BookingCardProps {
  booking: MyBooking;
  onViewDetails?: (booking: MyBooking) => void;
  onCancel?: (booking: MyBooking) => void;
  onReschedule?: (booking: MyBooking) => void;
}

export default function BookingCard({
  booking,
  onViewDetails,
  onCancel,
  onReschedule,
}: BookingCardProps) {
  const statusBorderColor =
    booking.status === "confirmed"
      ? "border-l-emerald-500"
      : booking.status === "rescheduled"
      ? "border-l-amber-500"
      : booking.status === "cancelled"
      ? "border-l-rose-400"
      : "border-l-slate-300";

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200/80 border-l-4 ${statusBorderColor} bg-surface-card p-4 sm:p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-raised`}>
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/15 shadow-2xs">
          {initials(booking.advisorName)}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-on-surface text-base">{booking.advisorName}</span>
            {booking.eventTypeName && (
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {booking.eventTypeName}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <MailIcon className="text-slate-400" />
            <span>{booking.advisorEmail}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/60 px-3.5 py-1.5 text-xs font-medium text-slate-700">
          <CalendarIcon className="text-slate-400" />
          <span>{formatBookingDate(booking.startTime)}</span>
        </div>

        <div className="hidden md:flex items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/60 px-3.5 py-1.5 text-xs font-medium text-slate-700">
          <ClockIcon className="text-slate-400" />
          <span>{formatBookingTimeRange(booking.startTime, booking.endTime)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        {booking.meetLink && (booking.status === "confirmed" || booking.status === "rescheduled") && (
          <a
            href={booking.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            title="Join Meet"
          >
            Meet
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
        )}
        <StatusBadge status={booking.status} />
        <BookingActionsMenu
          booking={booking}
          onViewDetails={() => onViewDetails?.(booking)}
          onCancel={() => onCancel?.(booking)}
          onReschedule={() => onReschedule?.(booking)}
        />
      </div>
    </div>
  );
}