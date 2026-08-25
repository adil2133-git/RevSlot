import dayjs from "dayjs";
import type { SlotItem } from "../type";
import { formatSlotTime } from "../utils";

type TimeSelectedCardProps = {
  heldSlot: SlotItem;
  use12Hour: boolean;
  secondsLeft: number;
  onChange: () => void;
  onContinue: () => void;
};

export default function TimeSelectedCard({
  heldSlot,
  use12Hour,
  secondsLeft,
  onChange,
  onContinue,
}: TimeSelectedCardProps) {
  return (
    <div>
      <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-800">Time selected</p>
            <p className="text-xs text-emerald-700">
              {dayjs(heldSlot.slotDate).format("dddd, MMMM D")} at{" "}
              {formatSlotTime(heldSlot.startTime, use12Hour)}
            </p>
          </div>
        </div>
        <button
          onClick={onChange}
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          Change
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 p-4">
        <p className="text-sm text-slate-600">
          Hold expires in{" "}
          <span className={secondsLeft <= 60 ? "font-medium text-error" : "font-medium text-on-surface"}>
            {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
          </span>
        </p>
        <button
          onClick={onContinue}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary"
        >
          Continue to details
        </button>
      </div>
    </div>
  );
}