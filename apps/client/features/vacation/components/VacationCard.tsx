import { useRef } from "react";
import { 
  PencilIcon, 
  TrashIcon, 
  CalendarIcon, 
  PlaneIcon, 
  SnowflakeIcon, 
  CocktailIcon 
} from "./icons";
import StatusBadge from "./StatusBadge";
import { formatDateRange, getVacationStatus } from "../utils/vacationStatus";
import type { VacationBlock } from "../api/vacationApi";

interface VacationCardProps {
  block: VacationBlock;
  onEdit: (block: VacationBlock) => void;
  onDelete: (block: VacationBlock) => void;
}

export default function VacationCard({ block, onEdit, onDelete }: VacationCardProps) {
  const lastTapRef = useRef<number>(0);
  const status = getVacationStatus(block.startDate, block.endDate);
  const isPast = status === "past";

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isPast) return;
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;
    const now = Date.now();
    if (now - lastTapRef.current < 350 && now - lastTapRef.current > 0) {
      onEdit(block);
    }
    lastTapRef.current = now;
  };

  // Determine icon based on reason
  const reasonText = block.reason || "Time Off";
  const norm = reasonText.toLowerCase();
  
  let Icon = CocktailIcon;
  let bgClass = "bg-[#e6eef5] text-[#003366] border border-blue-100/50";
  
  if (norm.includes("conference") || norm.includes("work") || norm.includes("meeting") || norm.includes("travel") || norm.includes("airplane")) {
    Icon = PlaneIcon;
    bgClass = status === "active" 
      ? "bg-[#e6f4ea] text-[#137333] border border-green-200/50" 
      : "bg-[#e6eef5] text-[#003366] border border-blue-100/50";
  } else if (norm.includes("winter") || norm.includes("break") || norm.includes("christmas") || norm.includes("snow") || norm.includes("holiday")) {
    Icon = SnowflakeIcon;
    bgClass = "bg-[#e6eef5] text-[#003366] border border-blue-100/50";
  }

  if (isPast) {
    bgClass = "bg-slate-100 text-slate-400 border border-slate-200/30";
  }

  return (
    <div
      onDoubleClick={() => !isPast && onEdit(block)}
      onTouchEnd={handleTouchEnd}
      className={`flex items-center justify-between rounded-xl border border-slate-100 p-5 shadow-surface transition-all duration-200 hover:shadow-raised ${
        isPast ? "bg-surface-hover/80" : "bg-surface-card cursor-pointer select-none"
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Left Icon Square */}
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${bgClass}`}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Middle Info Column */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h3
              className={`text-base font-bold tracking-tight ${
                isPast ? "text-slate-400" : "text-on-surface"
              }`}
            >
              {reasonText}
            </h3>
            <StatusBadge status={status} />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              {formatDateRange(block.startDate, block.endDate)}
            </span>
            {status === "active" && (
              <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <path d="m9 16 2 2 4-4" />
                </svg>
                All sessions blocked
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onEdit(block)}
          disabled={isPast}
          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-surface-hover hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Edit vacation block"
        >
          <PencilIcon className="h-4.5 w-4.5" />
        </button>
        <button
          onClick={() => onDelete(block)}
          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-error-container/80 hover:text-error"
          aria-label="Delete vacation block"
        >
          <TrashIcon className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
}