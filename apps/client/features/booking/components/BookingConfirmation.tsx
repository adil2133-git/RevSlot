"use client";

import dayjs from "dayjs";
import Link from "next/link";
import type { BookingPageInfo, SlotItem } from "../type";
import { formatSlotTime } from "../utils";
import PoweredByFooter from "./PoweredByFooter";

type BookingConfirmationProps = {
  pageInfo: BookingPageInfo;
  heldSlot: SlotItem | null;
  advisorEmail: string;
  use12Hour: boolean;
};

export default function BookingConfirmation({
  pageInfo,
  heldSlot,
  advisorEmail,
  use12Hour,
}: BookingConfirmationProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-surface-card p-8 text-center shadow-sm">
        <h1 className="mb-2 text-xl font-semibold text-on-surface">
          Booking confirmed!
        </h1>
        {heldSlot && (
          <p className="mt-1 text-sm font-medium text-on-surface">
            {dayjs(heldSlot.date).format("ddd, MMM D")} ·{" "}
            {formatSlotTime(heldSlot.startTime, use12Hour)}–
            {formatSlotTime(heldSlot.endTime, use12Hour)}{" "}
            ({pageInfo.eventType.timezone})
          </p>
        )}
        <p className="mt-1 text-sm text-slate-600">
          with {pageInfo.reviewer.name}
        </p>
        <p className="mt-3 text-sm text-slate-600">
          A confirmation email has been sent to {advisorEmail}.
        </p>
         
         <div className="mt-6 flex flex-col gap-2">
          <button
             type="button"
             onClick={() => window.location.reload()}
             className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90"
           >
           Check My Bookings
        </button>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
             type="button"
             onClick={() => window.location.reload()}
             className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-hover"
          >
           Book Another Slot
         </button>
        </div>
      </div>
      <PoweredByFooter />
    </div>
  </div>
  );
};