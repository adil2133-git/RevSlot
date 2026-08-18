"use client";

import Switch from "@/components/common/Switch";
import TimeInput from "./TimeInput";
import { PlusIcon, XIcon } from "./icons";

export interface DayBlock {
  localId: string;
  startTime: string;
  endTime: string;
}

interface DayRowProps {
  label: string;
  enabled: boolean;
  blocks: DayBlock[];
  onToggle: () => void;
  onBlockChange: (localId: string, field: "startTime" | "endTime", value: string) => void;
  onAddBlock: () => void;
  onRemoveBlock: (localId: string) => void;
}

export default function DayRow({
  label,
  enabled,
  blocks,
  onToggle,
  onBlockChange,
  onAddBlock,
  onRemoveBlock,
}: DayRowProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 last:border-b-0 sm:flex-row sm:items-start">
      <div className="flex w-28 shrink-0 items-center gap-3 pt-1.5">
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
                  className="p-1 text-slate-400 hover:text-error"
                  aria-label="Remove time block"
                >
                  <XIcon />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onAddBlock}
        disabled={!enabled}
        className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-surface-hover hover:text-primary disabled:opacity-30"
        aria-label={`Add time block for ${label}`}
      >
        <PlusIcon />
      </button>
    </div>
  );
}