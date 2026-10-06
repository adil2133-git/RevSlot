"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon } from "./icons";

export interface DayOption {
  dayOfWeek: number;
  label: string;
}

interface CopyTimesPopoverProps {
  sourceDayOfWeek: number;
  sourceDayLabel: string;
  days: DayOption[];
  onClose: () => void;
  onApply: (targetDaysOfWeek: number[]) => void;
}

export default function CopyTimesPopover({
  sourceDayOfWeek,
  sourceDayLabel,
  days,
  onClose,
  onApply,
}: CopyTimesPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");

  // Filter out the source day to get candidate target days
  const targetDays = days.filter((d) => d.dayOfWeek !== sourceDayOfWeek);
  const allSelected =
    targetDays.length > 0 && targetDays.every((d) => selectedDays.has(d.dayOfWeek));

  // Determine vertical placement based on viewport space
  useEffect(() => {
    if (popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.top;
      if (spaceBelow < 340) {
        setPlacement("top");
      }
    }
  }, []);

  // Handle outside click & Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  function toggleAll() {
    if (allSelected) {
      setSelectedDays(new Set());
    } else {
      setSelectedDays(new Set(targetDays.map((d) => d.dayOfWeek)));
    }
  }

  function toggleDay(dayOfWeek: number) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayOfWeek)) {
        next.delete(dayOfWeek);
      } else {
        next.add(dayOfWeek);
      }
      return next;
    });
  }

  function handleApply() {
    if (selectedDays.size === 0) return;
    onApply(Array.from(selectedDays));
  }

  return (
    <div
      ref={popoverRef}
      className={`absolute right-0 z-40 w-60 rounded-xl border border-slate-200 bg-white p-3 shadow-lg ${
        placement === "top" ? "bottom-full mb-2" : "top-full mt-2"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2 px-1 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Copy times to
        </span>
        <span className="text-[11px] font-medium text-slate-400">
          From {sourceDayLabel}
        </span>
      </div>

      {/* Select All Option */}
      <button
        type="button"
        onClick={toggleAll}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100/70"
      >
        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
          {allSelected && <CheckIcon size={14} strokeWidth={2.5} />}
        </span>
        <span>Select all</span>
      </button>

      <div className="my-1.5 border-t border-slate-100" />

      {/* List of Days */}
      <div className="space-y-0.5">
        {days.map((day) => {
          const isSource = day.dayOfWeek === sourceDayOfWeek;
          const isChecked = isSource || selectedDays.has(day.dayOfWeek);

          if (isSource) {
            return (
              <div
                key={day.dayOfWeek}
                className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm text-slate-400"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center text-slate-300">
                    <CheckIcon size={14} strokeWidth={2} />
                  </span>
                  <span>{day.label}</span>
                </div>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Current
                </span>
              </div>
            );
          }

          return (
            <button
              key={day.dayOfWeek}
              type="button"
              onClick={() => toggleDay(day.dayOfWeek)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-slate-100/70"
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center text-primary">
                {isChecked ? (
                  <CheckIcon size={14} strokeWidth={2.5} />
                ) : (
                  <span className="h-4 w-4" />
                )}
              </span>
              <span
                className={
                  isChecked
                    ? "font-medium text-slate-900"
                    : "font-normal text-slate-600"
                }
              >
                {day.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Apply Button */}
      <div className="mt-3 pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={handleApply}
          disabled={selectedDays.size === 0}
          className="w-full rounded-lg bg-primary py-2 text-center text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#002244] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {selectedDays.size > 0
            ? `Apply (${selectedDays.size})`
            : "Apply"}
        </button>
      </div>
    </div>
  );
}
