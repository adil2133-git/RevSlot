import type { VacationStatus } from "../utils/vacationStatus";

const STATUS_STYLES: Record<VacationStatus, string> = {
  active: "bg-primary text-on-primary",
  upcoming: "bg-secondary text-on-secondary",
  past: "bg-slate-100 text-slate-400",
};

const STATUS_LABELS: Record<VacationStatus, string> = {
  active: "Active",
  upcoming: "Upcoming",
  past: "Past",
};

export default function StatusBadge({ status }: { status: VacationStatus }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}