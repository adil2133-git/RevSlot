"use client";

import { useState } from "react";
import Switch from "@/components/common/Switch";
import TimeInput from "./TimeInput";
import { PlusIcon, XIcon } from "./icons";
import { createOverrideRequest, deleteOverrideRequest } from "../api/overrides.api";
import type { DateOverride } from "../types";

interface DraftBlock {
  localId: string;
  startTime: string;
  endTime: string;
}

interface DateOverridesSectionProps {
  templateId: number | null; // null = template not saved yet
  overrides: DateOverride[];
  onOverridesChange: (overrides: DateOverride[]) => void;
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function DateOverridesSection({ templateId, overrides, onOverridesChange }: DateOverridesSectionProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [date, setDate] = useState("");
  const [unavailable, setUnavailable] = useState(true);
  const [blocks, setBlocks] = useState<DraftBlock[]>([
    { localId: crypto.randomUUID(), startTime: "09:00", endTime: "17:00" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setDate("");
    setUnavailable(true);
    setBlocks([{ localId: crypto.randomUUID(), startTime: "09:00", endTime: "17:00" }]);
    setError(null);
    setFormOpen(false);
  }

  async function handleAdd() {
    if (!templateId) return;
    if (!date) {
      setError("Pick a date.");
      return;
    }
    if (!unavailable && blocks.length === 0) {
      setError("Add at least one time block, or mark the date unavailable.");
      return;
    }
    for (const b of blocks) {
      if (b.endTime <= b.startTime) {
        setError("Each block's end time must be after its start time.");
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const override = await createOverrideRequest(templateId, {
        date,
        isUnavailable: unavailable,
        blocks: unavailable
          ? []
          : blocks.map((b, idx) => ({ startTime: b.startTime, endTime: b.endTime, displayOrder: idx })),
      });
      onOverridesChange([...overrides, override].sort((a, b) => a.date.localeCompare(b.date)));
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add override");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(overrideId: number) {
    if (!templateId) return;
    const previous = overrides;
    onOverridesChange(overrides.filter((o) => o.id !== overrideId)); // optimistic
    try {
      await deleteOverrideRequest(templateId, overrideId);
    } catch (err) {
      onOverridesChange(previous); // rollback
      setError(err instanceof Error ? err.message : "Failed to remove override");
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-100 bg-surface-card p-5 shadow-surface">
      <h2 className="text-base font-semibold text-on-surface">Date overrides</h2>
      <p className="mt-1 text-sm text-slate-500">
        Add dates when your availability changes from your daily hours.
      </p>

      {!templateId && (
        <p className="mt-4 rounded-lg bg-secondary px-3.5 py-2.5 text-sm text-primary">
          Save your schedule first to add date overrides.
        </p>
      )}

      {overrides.length > 0 && (
        <div className="mt-4 space-y-2">
          {overrides.map((o) => (
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
              <button
                type="button"
                onClick={() => handleRemove(o.id)}
                className="text-slate-400 hover:text-error"
                aria-label="Remove override"
              >
                <XIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-error">{error}</p>}

      {templateId && (
        formOpen ? (
          <div className="mt-4 space-y-3 rounded-lg border border-slate-100 p-3.5">
            <input
              type="date"
              min={todayISO()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <div className="flex items-center gap-2.5">
              <Switch checked={!unavailable} onChange={() => setUnavailable((v) => !v)} />
              <span className="text-sm text-on-surface">Available on this date</span>
            </div>

            {!unavailable && (
              <div className="space-y-2">
                {blocks.map((block) => (
                  <div key={block.localId} className="flex items-center gap-2">
                    <TimeInput
                      value={block.startTime}
                      onChange={(v) => setBlocks((prev) => prev.map((b) => (b.localId === block.localId ? { ...b, startTime: v } : b)))}
                    />
                    <span className="text-sm text-slate-400">-</span>
                    <TimeInput
                      value={block.endTime}
                      onChange={(v) => setBlocks((prev) => prev.map((b) => (b.localId === block.localId ? { ...b, endTime: v } : b)))}
                    />
                    <button
                      type="button"
                      onClick={() => setBlocks((prev) => prev.filter((b) => b.localId !== block.localId))}
                      className="p-1 text-slate-400 hover:text-error"
                      aria-label="Remove block"
                    >
                      <XIcon />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setBlocks((prev) => [...prev, { localId: crypto.randomUUID(), startTime: "09:00", endTime: "17:00" }])
                  }
                  className="flex items-center gap-1.5 text-sm font-medium text-primary"
                >
                  <PlusIcon size={14} /> Add another block
                </button>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleAdd}
                disabled={saving}
                className="rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-on-primary disabled:opacity-60"
              >
                {saving ? "Adding…" : "Add"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-slate-500 hover:bg-surface-hover"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="mt-4 flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-on-surface hover:bg-surface-hover"
          >
            <PlusIcon size={15} />
            Add an override
          </button>
        )
      )}
    </div>
  );
}