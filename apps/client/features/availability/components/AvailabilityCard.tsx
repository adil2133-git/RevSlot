"use client";

import { useState } from "react";
import type { AvailabilityTemplate } from "../types";
import { groupTimeBlocks } from "../utils/groupTimeBlocks";

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

const DotsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <circle cx="12" cy="5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

interface AvailabilityCardProps {
  template: AvailabilityTemplate;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function AvailabilityCard({ template, onEdit, onDelete }: AvailabilityCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const groups = groupTimeBlocks(template.timeBlocks);

  return (
    <div
      onDoubleClick={() => onEdit(template.id)}
      className="group rounded-xl border border-slate-100 bg-surface-card p-5 shadow-surface transition-shadow hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3
            onClick={() => onEdit(template.id)}
            className="cursor-pointer text-lg font-semibold leading-snug text-on-surface hover:text-primary hover:underline"
            title="Click to edit schedule"
          >
            {template.name}
          </h3>
          {template.isDefault && (
            <span className="mt-2 inline-block rounded-md bg-slate-400 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
              Default
            </span>
          )}
        </div>

        <div
          className="relative shrink-0"
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-md p-1 text-slate-400 hover:bg-surface-hover hover:text-on-surface"
            aria-label="Template actions"
          >
            <DotsIcon />
          </button>
          {menuOpen && (
            <div
              onMouseLeave={() => setMenuOpen(false)}
              className="absolute right-0 top-8 z-10 w-32 overflow-hidden rounded-lg border border-slate-100 bg-surface-card shadow-raised"
            >
              <button
                onClick={() => { setMenuOpen(false); onEdit(template.id); }}
                className="block w-full px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-hover"
              >
                Edit
              </button>
              <button
                onClick={() => { setMenuOpen(false); onDelete(template.id); }}
                className="block w-full px-3 py-2 text-left text-sm text-error hover:bg-error-container"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-slate-400">No time blocks yet.</p>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.key} className="border-l-2 border-slate-200 pl-3">
              <p className="text-sm font-medium text-on-surface">{group.days}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                <ClockIcon />
                {group.startTime} – {group.endTime}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}