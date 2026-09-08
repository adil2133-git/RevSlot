import { STATUS_LABELS, STATUS_STYLES } from "../utils/bookingDisplay";

export default function StatusBadge({ status }: { status: string }) {
      const dotColor =
    status === "confirmed"
      ? "bg-emerald-500"
      : status === "rescheduled"
      ? "bg-amber-500"
      : status === "in_progress"
      ? "bg-blue-500"
      : status === "outcome_required"
      ? "bg-orange-500"
      : status === "completed"
      ? "bg-emerald-500"
      : status === "no_show"
      ? "bg-rose-500"
      : status === "cancelled"
      ? "bg-rose-500"
      : "bg-slate-400";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-2xs ${
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-500 border border-slate-200"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}