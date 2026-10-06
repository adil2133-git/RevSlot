"use client";

import clsx from "clsx";
import Switch from "@/components/common/Switch";
import TimeInput from "./TimeInput";
import { PlusIcon, XIcon, CopyIcon } from "./icons";
import CopyTimesPopover, { DayOption } from "./CopyTimesPopover";

export interface DayBlock {
  localId: string;
  startTime: string;
  endTime: string;
}

interface DayRowProps {
  dayOfWeek: number;
  label: string;
  enabled: boolean;
  blocks: DayBlock[];
  allDays: DayOption[];
  isCopyOpen: boolean;
  onToggleCopy: () => void;
  onCloseCopy: () => void;
  onCopyTimes: (targetDaysOfWeek: number[]) => void;
  onToggle: () => void;
  onBlockChange: (localId: string, field: "startTime" | "endTime", value: string) => void;
  onAddBlock: () => void;
  onRemoveBlock: (localId: string) => void;
}

export default function DayRow({
  dayOfWeek,
  label,
  enabled,
  blocks,
  allDays,
  isCopyOpen,
  onToggleCopy,
  onCloseCopy,
  onCopyTimes,
  onToggle,
  onBlockChange,
  onAddBlock,
  onRemoveBlock,
}: DayRowProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 last:border-b-0 sm:flex-row sm:items-start">
      <div className="flex w-36 shrink-0 items-center gap-3 pt-1.5">
        <Switch checked={enabled} onChange={onToggle} />
        <span className="text-sm font-medium text-on-surface">{label}</span>
      </div>

      <div className="flex-1">
        {!enabled || blocks.length === 0 ? (
          <p className="pt-1.5 text-sm italic text-slate-400">Unavailable</p>
        ) : (
          <div className="space-y-2">
            {blocks.map((block) => (
              <div key={block.localId} className="flex items-center gap-2">
                <TimeInput
                  value={block.startTime}
                  onChange={(v) => onBlockChange(block.localId, "startTime", v)}
                />
                <span className="text-sm text-slate-400">-</span>
                <TimeInput
                  value={block.endTime}
                  onChange={(v) => onBlockChange(block.localId, "endTime", v)}
                />
                <button
                  type="button"
                  onClick={() => onRemoveBlock(block.localId)}
                  className="p-1 text-slate-400 hover:text-error transition-colors"
                  aria-label="Remove time block"
                >
                  <XIcon />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="relative shrink-0 flex items-center gap-1">
        <button
          type="button"
          onClick={onAddBlock}
          disabled={!enabled}
          className="rounded-md p-1.5 text-slate-400 hover:bg-surface-hover hover:text-primary disabled:opacity-30 transition-colors"
          aria-label={`Add time block for ${label}`}
          title={`Add time block for ${label}`}
        >
          <PlusIcon />
        </button>

        <button
          type="button"
          onClick={onToggleCopy}
          className={clsx(
            "rounded-md p-1.5 transition-colors cursor-pointer",
            isCopyOpen
              ? "bg-slate-100 text-primary"
              : "text-slate-400 hover:bg-surface-hover hover:text-primary"
          )}
          aria-label={`Copy availability from ${label}`}
          title={`Copy ${label}'s hours to other days`}
        >
          <CopyIcon size={16} />
        </button>

        {isCopyOpen && (
          <CopyTimesPopover
            sourceDayOfWeek={dayOfWeek}
            sourceDayLabel={label}
            days={allDays}
            onClose={onCloseCopy}
            onApply={onCopyTimes}
          />
        )}
      </div>
    </div>
  );
}