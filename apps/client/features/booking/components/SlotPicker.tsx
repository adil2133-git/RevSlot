import dayjs from "dayjs";
import type { SlotItem } from "../type";
import { formatSlotTime } from "../utils";

type SlotPickerProps = {
  selectedDate: string;
  use12Hour: boolean;
  setUse12Hour: (value: boolean) => void;
  slotsLoading: boolean;
  slotsForSelectedDate: SlotItem[];
  holding: boolean;
  holdError: string | null;
  onSelectSlot: (slot: SlotItem) => void;
};

export default function SlotPicker({
  selectedDate,
  use12Hour,
  setUse12Hour,
  slotsLoading,
  slotsForSelectedDate,
  holding,
  holdError,
  onSelectSlot,
}: SlotPickerProps) {
  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-on-surface">
          {dayjs(selectedDate).format("dddd, MMMM D")}
        </p>
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setUse12Hour(true)}
            className={`rounded-md px-2 py-1 ${
              use12Hour ? "bg-primary text-on-primary" : "text-slate-500"
            }`}
          >
            12h
          </button>
          <button
            onClick={() => setUse12Hour(false)}
            className={`rounded-md px-2 py-1 ${
              !use12Hour ? "bg-primary text-on-primary" : "text-slate-500"
            }`}
          >
            24h
          </button>
        </div>
      </div>

      {slotsLoading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-600">
          <svg
            className="h-4 w-4 animate-spin text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          Loading available times...
        </div>
      ) : slotsForSelectedDate.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <svg
            className="h-8 w-8 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-slate-600">
            No available times on this date.
          </p>
          <p className="text-xs text-slate-400">
            Try another day on the calendar above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {slotsForSelectedDate.map((slot) => (
            <button
              key={slot.id}
              disabled={holding}
              onClick={() => onSelectSlot(slot)}
              className="rounded-lg border border-slate-300 bg-surface-card px-3 py-2 text-sm text-on-surface hover:border-primary disabled:opacity-50"
            >
              {formatSlotTime(slot.startTime, use12Hour)}
            </button>
          ))}
        </div>
      )}

      {holdError && <p className="mt-4 text-sm text-error">{holdError}</p>}
    </>
  );
}