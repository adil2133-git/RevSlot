"use client";

import { useState } from "react";
import DateOverrideModal from "./DateOverrideModal";
import { deleteOverrideRequest } from "../api/overrides.api";
import { PlusIcon, XIcon } from "./icons";
import type { DateOverride } from "../types";

interface DateOverridesSectionProps {
  templateId: number | null;
  overrides: DateOverride[];
  onOverridesChange: (overrides: DateOverride[]) => void;
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function DateOverridesSection({ templateId, overrides, onOverridesChange }: DateOverridesSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove(overrideId: number) {
    if (!templateId) return;
    const previous = overrides;
    onOverridesChange(overrides.filter((o) => o.id !== overrideId));
    try {
      await deleteOverrideRequest(templateId, overrideId);
    } catch (err) {
      onOverridesChange(previous);
      setError(err instanceof Error ? err.message : "Failed to remove override");
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-100 bg-surface-card p-5 shadow-surface">
      <h2 className="text-base font-semibold text-on-surface">Date overrides</h2>
      <p className="mt-1 text-sm text-slate-500">Add dates when your availability changes from your daily hours.</p>

      {!templateId && (
        <p className="mt-4 rounded-lg bg-secondary px-3.5 py-2.5 text-sm text-primary">
          Save your schedule first to add date overrides.
        </p>
      )}

      {error && <p className="mt-3 text-sm text-error">{error}</p>}

      {overrides.length > 0 && (
        <div className="mt-4 space-y-2">
          {overrides
            .slice()
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((o) => (
              <div key={o.id} className="flex items-start justify-between rounded-lg border border-slate-100 px-3.5 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-on-surface">{formatDate(o.date)}</p>
                  {o.isUnavailable ? (
                    <p className="text-slate-500">Unavailable</p>
                  ) : (
                    <div className="mt-0.5 space-y-0.5 text-slate-500">
                      {o.blocks.map((b) => (
                        <p key={b.id}>{b.startTime.slice(0, 5)} – {b.endTime.slice(0, 5)}</p>
                      ))}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => handleRemove(o.id)} className="text-slate-400 hover:text-error" aria-label="Remove override">
                  <XIcon />
                </button>
              </div>
            ))}
        </div>
      )}

      {templateId && (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="mt-4 flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-on-surface hover:bg-surface-hover"
        >
          <PlusIcon size={15} />
          Add an override
        </button>
      )}

      {modalOpen && templateId && (
        <DateOverrideModal
          templateId={templateId}
          existingDates={overrides.map((o) => o.date)}
          onClose={() => setModalOpen(false)}
          onCreated={(override) => onOverridesChange([...overrides, override])}
        />
      )}
    </div>
  );
}