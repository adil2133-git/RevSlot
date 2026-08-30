import dayjs from "dayjs";

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

export const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
  rescheduled: "Rescheduled",
};

export const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-secondary text-on-secondary",
  completed: "bg-slate-100 text-slate-400",
  cancelled: "bg-error-container text-error",
  no_show: "bg-error-container text-error",
  rescheduled: "bg-secondary text-on-secondary",
};