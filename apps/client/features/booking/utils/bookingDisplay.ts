import dayjs from "dayjs";

export const CANCEL_CUTOFF_HOURS = 3;

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatBookingDate(startTime: string) {
  return dayjs(startTime).format("MMM D, YYYY");
}

export function formatBookingTimeRange(startTime: string, endTime: string) {
  return `${dayjs(startTime).format("h:mm A")} – ${dayjs(endTime).format("h:mm A")}`;
}

// Mirrors the backend's CANCEL_CUTOFF_HOURS check — used to disable the
// Cancel/Reschedule options client-side rather than letting the user hit
// submit and get a 409 back.
export function isWithinCancelCutoff(startTime: string) {
  const hoursUntilStart = dayjs(startTime).diff(dayjs(), "hour", true);
  return hoursUntilStart < CANCEL_CUTOFF_HOURS;
}

export const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
  rescheduled: "Rescheduled",
};

export const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
  completed: "bg-slate-100 text-slate-600 border border-slate-200/80",
  cancelled: "bg-rose-50 text-rose-700 border border-rose-200/80",
  no_show: "bg-rose-50 text-rose-700 border border-rose-200/80",
  rescheduled: "bg-amber-50 text-amber-800 border border-amber-300/80",
};