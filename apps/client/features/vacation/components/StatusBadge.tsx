import type { VacationStatus } from "../utils/vacationStatus";

const STATUS_STYLES: Record<VacationStatus, string> = {
  active: "bg-[#e6f4ea] text-[#137333] border border-green-200/50",
  upcoming: "bg-[#e6eef5] text-[#003366] border border-blue-100/50",
  past: "bg-slate-100 text-slate-500 border border-slate-200/30",
};

const STATUS_LABELS: Record<VacationStatus, string> = {
  active: "Active now",
  upcoming: "Upcoming",
  past: "Past",
};

export default function StatusBadge({ status }: { status: VacationStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${STATUS_STYLES[status]}`}
    >
      {status === "active" && (
        <span className="h-1.5 w-1.5 rounded-full bg-[#137333] animate-pulse" />
      )}
      {STATUS_LABELS[status]}
    </span>
  );
}