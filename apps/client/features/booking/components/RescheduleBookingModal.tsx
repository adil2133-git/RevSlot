"use client";

import { useState } from "react";
import Modal from "@/components/common/Modal";
import { XIcon, AlertTriangleIcon } from "./icons";
import MonthCalendar from "./MonthCalender";
import SlotPicker from "./SlotPicker";
import { useAvailableSlots } from "../hooks/useAvailableSlots";
import { formatBookingDate, formatBookingTimeRange, isWithinCancelCutoff, CANCEL_CUTOFF_HOURS } from "../utils/bookingDisplay";
import { rescheduleBooking } from "../api/bookingApi";
import type { MyBooking, SlotItem } from "../type";
import dayjs from "dayjs";

interface RescheduleBookingModalProps {
  booking: MyBooking;
  onClose: () => void;
  onRescheduled: () => void;
}

export default function RescheduleBookingModal({
  booking,
  onClose,
  onRescheduled,
}: RescheduleBookingModalProps) {
  const {
    visibleMonth,
    setVisibleMonth,
    slots,
    slotsLoading,
    calendarDays,
    availableCountByDate,
  } = useAvailableSlots(booking.eventTypeId);

  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [use12Hour, setUse12Hour] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withinCutoff = isWithinCancelCutoff(booking.startTime);

  const slotsForSelectedDate = slots.filter((s) => s.date === selectedDate);

  const handleSubmit = async () => {
    if (!selectedSlot) return;

    setSubmitting(true);
    setError(null);
    try {
      await rescheduleBooking(booking.id, {
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });
      onRescheduled();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reschedule booking.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} widthClassName="max-w-lg">
      <div className="flex items-center justify-between border-b border-slate-100 p-6">
        <h2 className="text-xl font-bold text-on-surface">Reschedule Booking</h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-surface-hover hover:text-on-surface"
          aria-label="Close"
        >
          <XIcon />
        </button>
      </div>

      <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
        <div className="rounded-xl border border-slate-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current time</p>
          <p className="mt-1 font-medium text-on-surface">{formatBookingDate(booking.startTime)}</p>
          <p className="text-sm text-slate-400">{formatBookingTimeRange(booking.startTime, booking.endTime)}</p>
        </div>

        {withinCutoff ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-800">
            <AlertTriangleIcon className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">This session starts too soon to reschedule</p>
              <p className="text-sm">
                Bookings can only be rescheduled at least {CANCEL_CUTOFF_HOURS} hours before the session starts.
              </p>
            </div>
          </div>
        ) : (
          <>
            <MonthCalendar
              visibleMonth={visibleMonth}
              setVisibleMonth={setVisibleMonth}
              calendarDays={calendarDays}
              selectedDate={selectedDate}
              setSelectedDate={(date) => {
                setSelectedDate(date);
                setSelectedSlot(null);
              }}
              availableCountByDate={availableCountByDate}
              bookingWindowDays={booking.bookingWindowDays}
            />

            <SlotPicker
              selectedDate={selectedDate}
              use12Hour={use12Hour}
              setUse12Hour={setUse12Hour}
              slotsLoading={slotsLoading}
              slotsForSelectedDate={slotsForSelectedDate}
              holding={submitting}
              holdError={null}
              onSelectSlot={setSelectedSlot}
            />

            {selectedSlot && (
              <div className="rounded-xl border border-primary bg-secondary p-4">
                <p className="text-sm font-semibold text-on-secondary">
                  New time: {dayjs(selectedSlot.date).format("MMM D, YYYY")} at{" "}
                  {dayjs(`2000-01-01T${selectedSlot.startTime}`).format("h:mm A")}
                </p>
              </div>
            )}

            {error && <p className="text-sm text-error">{error}</p>}
          </>
        )}
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
            disabled={!selectedSlot || submitting}
            className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Rescheduling..." : "Confirm Reschedule"}
          </button>
        )}
      </div>
    </Modal>
  );
}