import { MailIcon, CalendarIcon, ClockIcon, MoreVerticalIcon } from "./icons";
import StatusBadge from "./StatusBadge";
import { initials, formatBookingDate, formatBookingTimeRange } from "../utils/bookingDisplay";
import type { MyBooking } from "../type";

export default function BookingCard({ booking }: { booking: MyBooking }) {
  return (
    <div className="flex items-center justify-between rounded-xl border-l-4 border-primary bg-surface-card p-5 shadow-surface">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-on-secondary">
          {initials(booking.advisorName)}
        </div>
        <div>
          <p className="font-semibold text-on-surface">{booking.advisorName}</p>
          <div className="mt-1 flex items-center gap-1 text-sm text-slate-400">
            <MailIcon />
            <span>{booking.advisorEmail}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-slate-300 px-4 py-2 text-sm text-on-surface">
        <CalendarIcon />
        <span>{formatBookingDate(booking.startTime)}</span>
      </div>

      <div className="hidden items-center gap-1 text-sm text-slate-400 md:flex">
        <ClockIcon />
        <span>{formatBookingTimeRange(booking.startTime, booking.endTime)}</span>
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge status={booking.status} />
        <button
          className="rounded-lg p-2 text-slate-400 hover:bg-surface-hover hover:text-on-surface"
          aria-label="More options"
        >
          <MoreVerticalIcon />
        </button>
      </div>
    </div>
  );
}