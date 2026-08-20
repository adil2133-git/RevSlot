"use client";

import { useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import Modal from "@/components/common/Modal";
import Switch from "@/components/common/Switch";
import TimeInput from "./TimeInput";
import { buildMonthGrid, getWeekdayLabels } from "../utils/calendar";
import { createOverrideRequest } from "../api/overrides.api";
import type { DateOverride } from "../types";
import { PlusIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, CalendarOffIcon, XIcon } from "./icons";

interface DraftBlock {
  localId: string;
  startTime: string;
  endTime: string;
}

interface DateOverrideModalProps {
  templateId: number;
  existingDates: string[]; // "YYYY-MM-DD" already-overridden dates
  onClose: () => void;
  onCreated: (override: DateOverride) => void;
}

export default function DateOverrideModal({ templateId, existingDates, onClose, onCreated }: DateOverrideModalProps) {
  const [monthAnchor, setMonthAnchor] = useState(dayjs().startOf("month"));
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [unavailable, setUnavailable] = useState(true);
  const [blocks, setBlocks] = useState<DraftBlock[]>([
    { localId: crypto.randomUUID(), startTime: "09:00", endTime: "17:00" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weeks = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor]);
  const weekdayLabels = getWeekdayLabels();
  const existingSet = useMemo(() => new Set(existingDates), [existingDates]);

  function selectDay(date: Dayjs, isPast: boolean) {
    if (isPast) return;
    if (existingSet.has(date.format("YYYY-MM-DD"))) return;
    if (!date.isSame(monthAnchor, "month")) setMonthAnchor(date.startOf("month"));
    setSelectedDate(date);
    setError(null);
  }

  function addBlock() {
    setBlocks((prev) => [...prev, { localId: crypto.randomUUID(), startTime: "09:00", endTime: "17:00" }]);
  }

  function removeBlock(localId: string) {
    setBlocks((prev) => prev.filter((b) => b.localId !== localId));
  }

  function updateBlock(localId: string, field: "startTime" | "endTime", value: string) {
    setBlocks((prev) => prev.map((b) => (b.localId === localId ? { ...b, [field]: value } : b)));
  }

  async function handleApply() {
    if (!selectedDate) {
      setError("Pick a date first.");
      return;
    }
    if (!unavailable) {
      if (blocks.length === 0) {
        setError("Add at least one time range, or mark the date unavailable.");
        return;
      }
      for (const b of blocks) {
        if (b.endTime <= b.startTime) {
          setError("Each time range's end must be after its start.");
          return;
        }
      }
    }

    setSaving(true);
    setError(null);
    try {
      const override = await createOverrideRequest(templateId, {
        date: selectedDate.format("YYYY-MM-DD"),
        isUnavailable: unavailable,
        blocks: unavailable
          ? []
          : blocks.map((b, idx) => ({ startTime: b.startTime, endTime: b.endTime, displayOrder: idx })),
      });
      onCreated(override);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply override");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} widthClassName="max-w-3xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-on-surface">Date Overrides</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-on-surface" aria-label="Close">
          <XIcon />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2">
        <div className="border-b border-slate-100 p-6 sm:border-b-0 sm:border-r">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Select date</p>
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMonthAnchor((m) => m.subtract(1, "month"))}
              className="rounded-md p-1 text-slate-400 hover:bg-surface-hover hover:text-on-surface"
              aria-label="Previous month"
            >
              <ChevronLeftIcon />
            </button>
            <p className="text-sm font-semibold text-on-surface">{monthAnchor.format("MMMM YYYY")}</p>
            <button
              type="button"
              onClick={() => setMonthAnchor((m) => m.add(1, "month"))}
              className="rounded-md p-1 text-slate-400 hover:bg-surface-hover hover:text-on-surface"
              aria-label="Next month"
            >
              <ChevronRightIcon />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center">
            {weekdayLabels.map((label, idx) => (
              <span key={idx} className="text-xs font-medium text-slate-400">
                {label}
              </span>
            ))}
            {weeks.map((week, wIdx) =>
              week.map((day, dIdx) => {
                const key = day.date.format("YYYY-MM-DD");
                const isSelected = selectedDate?.isSame(day.date, "day") ?? false;
                const isOverridden = existingSet.has(key);
                const disabled = day.isPast || isOverridden;
                return (
                  <button
                    key={`${wIdx}-${dIdx}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => selectDay(day.date, day.isPast)}
                    className={`relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ${
                      isSelected
                        ? "bg-primary font-semibold text-on-primary"
                        : day.inCurrentMonth
                          ? disabled
                            ? "text-slate-300"
                            : "text-on-surface hover:bg-surface-hover"
                          : "text-slate-300"
                    } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {day.label}
                    {isOverridden && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-surface p-6">
          {!selectedDate ? (
            <p className="text-sm text-slate-400">Pick a date from the calendar to configure it.</p>
          ) : (
            <>
              <h3 className="text-base font-semibold text-on-surface">{selectedDate.format("MMMM D, YYYY")}</h3>
              <p className="mt-1 text-sm text-slate-500">Configure availability for this specific date.</p>

              <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-surface-card px-3.5 py-3">
                <div>
                  <p className="text-sm font-medium text-on-surface">Mark unavailable</p>
                  <p className="text-xs text-slate-400">Block out the entire day</p>
                </div>
                <Switch checked={unavailable} onChange={() => setUnavailable((v) => !v)} />
              </div>

              {unavailable ? (
                <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center">
                  <span className="text-slate-400">
                    <CalendarOffIcon />
                  </span>
                  <p className="mt-2.5 text-sm font-semibold text-on-surface">Unavailable</p>
                  <p className="mt-1 text-xs text-slate-500">No meetings can be scheduled on this date.</p>
                </div>
              ) : (
                <div className="mt-4 space-y-2.5">
                  {blocks.map((block) => (
                    <div key={block.localId} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-surface-card px-3 py-2.5">
                      <TimeInput value={block.startTime} onChange={(v) => updateBlock(block.localId, "startTime", v)} />
                      <span className="text-sm text-slate-400">-</span>
                      <TimeInput value={block.endTime} onChange={(v) => updateBlock(block.localId, "endTime", v)} />
                      <button
                        type="button"
                        onClick={() => removeBlock(block.localId)}
                        className="ml-auto text-slate-400 hover:text-error"
                        aria-label="Remove time range"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addBlock} className="flex items-center gap-1.5 text-sm font-medium text-primary">
                    <PlusIcon size={14} /> Add another time range
                  </button>
                </div>
              )}

              {error && <p className="mt-3 text-sm text-error">{error}</p>}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
        <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-surface-hover">
          Cancel
        </button>
        <button
          type="button"
          onClick={handleApply}
          disabled={saving || !selectedDate}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-on-primary shadow-surface disabled:opacity-50"
        >
          {saving ? "Applying…" : "Apply Override"}
        </button>
      </div>
    </Modal>
  );
}