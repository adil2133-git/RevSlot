"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dayjs from "dayjs";

import RangeCalendar from "@/features/vacation/components/RangeCalendar";
import DateRangeInputs from "@/features/vacation/components/DateRangeInputs";
import AffectedBookingsDialog from "@/features/vacation/components/AffectedBookingsDialog";
import { WarningIcon } from "@/features/vacation/components/icons";
import { findOverlappingBlock } from "@/features/vacation/utils/dateRangeOverlap";
import {
  listVacationBlocks,
  updateVacationBlock,
  isConfirmationRequiredError,
  type VacationBlock,
  type AffectedBooking,
} from "@/features/vacation/api/vacationApi";

export default function EditVacationPage() {
  const router = useRouter();
  const params = useParams();
  const blockId = Number(params.id);

  const [existingBlocks, setExistingBlocks] = useState<VacationBlock[]>([]);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [affectedBookings, setAffectedBookings] = useState<AffectedBooking[] | null>(null);

  const today = dayjs().format("YYYY-MM-DD");

  useEffect(() => {
    listVacationBlocks().then((blocks) => {
      setExistingBlocks(blocks);
      const current = blocks.find((b) => b.id === blockId);
      if (!current) {
        setNotFound(true);
      } else {
        setStartDate(current.startDate);
        setEndDate(current.endDate);
        setReason(current.reason ?? "");
      }
      setLoading(false);
    });
  }, [blockId]);

  const overlap =
    startDate && endDate
      ? findOverlappingBlock(startDate, endDate, existingBlocks, blockId)
      : null;

  const canSubmit = startDate && endDate && !overlap && !submitting;

  const handleDateChange = (start: string | null, end: string | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  const submit = async (confirmCancellations: boolean) => {
    if (!startDate || !endDate) return;

    setSubmitting(true);
    try {
      await updateVacationBlock(blockId, {
        startDate,
        endDate,
        reason: reason.trim() || undefined,
        confirmCancellations,
      });
      router.push("/dashboard/vacation");
    } catch (err) {
      if (isConfirmationRequiredError(err)) {
        setAffectedBookings(err.details.affectedBookings);
      } else {
        alert("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    submit(false);
  };

  const handleConfirmCancellations = () => {
    submit(true);
  };

  if (loading) {
    return <div className="container-page py-10 text-slate-400">Loading...</div>;
  }

  if (notFound) {
    return (
      <div className="container-page py-10">
        <p className="text-error">Vacation block not found.</p>
        <button
          onClick={() => router.push("/dashboard/vacation")}
          className="mt-4 text-primary underline"
        >
          Back to Vacation
        </button>
      </div>
    );
  }

  return (
    <div className="container-page max-w-4xl py-10">
      <h1 className="text-3xl font-bold text-on-surface">Edit Vacation</h1>
      <p className="mt-1 text-slate-400">Update the dates or reason for this vacation block.</p>

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
          {submitting ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {affectedBookings && (
        <AffectedBookingsDialog
          affectedBookings={affectedBookings}
          reason={reason}
          submitting={submitting}
          onCancel={() => setAffectedBookings(null)}
          onConfirm={handleConfirmCancellations}
        />
      )}
    </div>
  );
}