"use client";

import { useState } from "react";
import dayjs from "dayjs";
import Switch from "@/components/common/Switch";
import TimeInput from "./TimeInput";
import { PlusIcon, XIcon } from "./icons";

export interface OverrideEntry {
  localId: string;
  date: string; // "YYYY-MM-DD"
  unavailable: boolean;
  startTime: string;
  endTime: string;
}

interface DateOverridesSectionProps {
  overrides: OverrideEntry[];
  onAdd: (entry: OverrideEntry) => void;
  onRemove: (localId: string) => void;
}

export default function DateOverridesSection({ overrides, onAdd, onRemove }: DateOverridesSectionProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [date, setDate] = useState("");
  const [unavailable, setUnavailable] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  function handleAdd() {
    if (!date) return;
    onAdd({
      localId: crypto.randomUUID(),
      date,
      unavailable,
      startTime,
      endTime,
    });
    setDate("");
    setUnavailable(true);
    setFormOpen(false);
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-100 bg-surface-card p-5 shadow-surface">
      <h2 className="text-base font-semibold text-on-surface">Date overrides</h2>
      <p className="mt-1 text-sm text-slate-500">
        Add dates when your availability changes from your daily hours.
      </p>

      {overrides.length > 0 && (
        <div className="mt-4 space-y-2">
          {overrides.map((o) => (
            <div
              key={o.localId}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-3.5 py-2 text-sm"
            >
              <span className="text-on-surface">
                {dayjs(o.date).format("MMM D, YYYY")} —{" "}
                {o.unavailable ? "Unavailable" : `${o.startTime} – ${o.endTime}`}
              </span>
              <button
                type="button"
                onClick={() => onRemove(o.localId)}
                className="text-slate-400 hover:text-error"
                aria-label="Remove override"
              >
                <XIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      {formOpen ? (
        <div className="mt-4 space-y-3 rounded-lg border border-slate-100 p-3.5">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <div className="flex items-center gap-2.5">
            <Switch checked={!unavailable} onChange={() => setUnavailable((v) => !v)} />
            <span className="text-sm text-on-surface">Available on this date</span>
          </div>
          {!unavailable && (
            <div className="flex items-center gap-2">
              <TimeInput value={startTime} onChange={setStartTime} />
              <span className="text-sm text-slate-400">-</span>
              <TimeInput value={endTime} onChange={setEndTime} />
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleAdd}
              className="rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-on-primary"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
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
      )}

      <p className="mt-3 text-xs text-slate-400">
        Note: date overrides aren&apos;t saved yet — this is a preview until the backend endpoint is ready.
      </p>
    </div>
  );
}