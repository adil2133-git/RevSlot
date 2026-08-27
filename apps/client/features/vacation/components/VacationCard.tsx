import { PencilIcon, TrashIcon, InfoIcon, HistoryIcon } from "./icons";
import StatusBadge from "./StatusBadge";
import { formatDateRange, getVacationStatus } from "../utils/vacationStatus";
import type { VacationBlock } from "../api/vacationApi";

interface VacationCardProps {
  block: VacationBlock;
  onEdit: (block: VacationBlock) => void;
  onDelete: (block: VacationBlock) => void;
}

export default function VacationCard({ block, onEdit, onDelete }: VacationCardProps) {
  const status = getVacationStatus(block.startDate, block.endDate);
  const isPast = status === "past";

  return (
    <div
      className={`flex items-center justify-between rounded-xl border border-slate-100 p-6 shadow-surface ${
        isPast ? "bg-surface-hover" : "bg-surface-card"
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h3
            className={`text-xl font-semibold ${
              isPast ? "text-slate-400" : "text-on-surface"
            }`}
          >
            {formatDateRange(block.startDate, block.endDate)}
          </h3>
          <StatusBadge status={status} />
        </div>
        {block.reason && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            {isPast ? <HistoryIcon /> : <InfoIcon />}
            <span>Reason: {block.reason}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onEdit(block)}
          disabled={isPast}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-surface-hover hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Edit vacation block"
        >
          <PencilIcon />
        </button>
        <button
          onClick={() => onDelete(block)}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-error-container hover:text-error"
          aria-label="Delete vacation block"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}