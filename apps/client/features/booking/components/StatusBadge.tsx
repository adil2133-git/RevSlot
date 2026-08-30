import { STATUS_LABELS, STATUS_STYLES } from "../utils/bookingDisplay";

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-400"
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}