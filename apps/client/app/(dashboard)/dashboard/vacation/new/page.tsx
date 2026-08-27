"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import RangeCalendar from "@/features/vacation/components/RangeCalendar";
import DateRangeInputs from "@/features/vacation/components/DateRangeInputs";
import { WarningIcon } from "@/features/vacation/components/icons";
import { findOverlappingBlock } from "@/features/vacation/utils/dateRangeOverlap";
import {
  listVacationBlocks,
  createVacationBlock,
  isConfirmationRequiredError,
  type VacationBlock,
} from "@/features/vacation/api/vacationApi";
import dayjs from "dayjs";

export default function NewVacationPage() {
  const router = useRouter();
  const [existingBlocks, setExistingBlocks] = useState<VacationBlock[]>([]);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const today = dayjs().format("YYYY-MM-DD");

  useEffect(() => {
    listVacationBlocks().then(setExistingBlocks);
  }, []);

  const overlap =
    startDate && endDate ? findOverlappingBlock(startDate, endDate, existingBlocks) : null;

  const canSubmit = startDate && endDate && !overlap && !submitting;

  const handleDateChange = (start: string | null, end: string | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleSubmit = async () => {
    if (!canSubmit || !startDate || !endDate) return;

    setSubmitting(true);
    try {
      await createVacationBlock({ startDate, endDate, reason: reason.trim() || undefined });
      router.push("/dashboard/vacation");
    } catch (err) {
      if (isConfirmationRequiredError(err)) {
        // TODO: navigate to / open the affected-bookings confirmation flow
        console.log("Affected bookings:", err.response.data.details.affectedBookings);
      } else {
        alert("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page max-w-4xl py-10">
      <h1 className="text-3xl font-bold text-on-surface">New Vacation</h1>
      <p className="mt-1 text-slate-400">Block off dates when you're unavailable.</p>

      <div className="mt-8 space-y-8 rounded-xl border border-slate-100 bg-surface-card p-8 shadow-surface">
        <div>
          <p className="mb-3 font-semibold text-on-surface">Select Date Range</p>
          <DateRangeInputs
            startDate={startDate}
            endDate={endDate}
            minDate={today}
            onChange={handleDateChange}
          />
        </div>

        <RangeCalendar startDate={startDate} endDate={endDate} onSelect={handleDateChange} />

        {overlap && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-800">
            <WarningIcon className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">This range overlaps an existing vacation block.</p>
              <p className="text-sm">
                Please adjust the dates or manage existing blocks to prevent conflicts.
              </p>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="reason" className="mb-2 block font-semibold text-on-surface">
            Reason (optional)
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="E.g., Winter Holiday..."
            rows={3}
            className="w-full rounded-lg border border-slate-300 p-3 text-on-surface placeholder:text-slate-400 focus:border-primary focus:outline-none"
          />
          <p className="mt-2 text-sm text-slate-400">
            If any bookings fall in this range, advisors will see this as the reason their
            session was cancelled.
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => router.push("/dashboard/vacation")}
          className="rounded-lg px-5 py-2.5 font-semibold text-slate-400 hover:bg-surface-hover"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Vacation"}
        </button>
      </div>
    </div>
  );
}