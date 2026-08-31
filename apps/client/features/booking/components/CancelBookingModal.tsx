"use client";

import { useState } from "react";
import Modal from "@/components/common/Modal";
import { XIcon, AlertTriangleIcon } from "./icons";
import { formatBookingDate, formatBookingTimeRange, isWithinCancelCutoff, CANCEL_CUTOFF_HOURS } from "../utils/bookingDisplay";
import { cancelBooking } from "../api/bookingApi";
import type { MyBooking } from "../type";

interface CancelBookingModalProps {
  booking: MyBooking;
  onClose: () => void;
  onCancelled: () => void;
}

export default function CancelBookingModal({ booking, onClose, onCancelled }: CancelBookingModalProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withinCutoff = isWithinCancelCutoff(booking.startTime);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for cancellation.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await cancelBooking(booking.id, { reason: reason.trim() });
      onCancelled();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} widthClassName="max-w-md">
      <div className="flex items-center justify-between border-b border-slate-100 p-6">
        <h2 className="text-xl font-bold text-on-surface">Cancel Booking</h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-surface-hover hover:text-on-surface"
          aria-label="Close"
        >
          <XIcon />
        </button>
      </div>

      <div className="space-y-4 p-6">
        <div className="rounded-xl border border-slate-100 p-4">
          <p className="font-medium text-on-surface">{booking.eventTypeName}</p>
          <p className="mt-1 text-sm text-slate-400">{formatBookingDate(booking.startTime)}</p>
          <p className="text-sm text-slate-400">{formatBookingTimeRange(booking.startTime, booking.endTime)}</p>
        </div>

        {withinCutoff ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-800">
            <AlertTriangleIcon className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">This session starts too soon to cancel</p>
              <p className="text-sm">
                Bookings can only be cancelled at least {CANCEL_CUTOFF_HOURS} hours before the session starts.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <label htmlFor="cancelReason" className="mb-2 block font-semibold text-on-surface">
              Reason for cancellation
            </label>
            <textarea
              id="cancelReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Let the advisor know why this session is being cancelled"
              rows={3}
              className="w-full rounded-lg border border-slate-300 p-3 text-on-surface placeholder:text-slate-400 focus:border-primary focus:outline-none"
            />
            <p className="mt-2 text-sm text-slate-400">
              The advisor will see this reason in their cancellation notice.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-error">{error}</p>}
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 p-6">
        <button
          onClick={onClose}
          className="rounded-lg px-5 py-2.5 font-semibold text-slate-400 hover:bg-surface-hover"
        >
          Close
        </button>
        {!withinCutoff && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-error px-5 py-2.5 font-semibold text-on-error transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Cancelling..." : "Cancel Booking"}
          </button>
        )}
      </div>
    </Modal>
  );
}