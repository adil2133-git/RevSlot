"use client";

import { useState } from "react";
import dayjs from "dayjs";
import type { AdvisorBookingItem } from "../types";
import { advisorApi } from "../services/advisorApi";
import { isWithinCancelCutoff, CANCEL_CUTOFF_HOURS, formatBookingDate, formatBookingTimeRange } from "@/features/booking/utils/bookingDisplay";
import { useAvailableSlots } from "@/features/booking/hooks/useAvailableSlots";
import MonthCalendar from "@/features/booking/components/MonthCalender";
import SlotPicker from "@/features/booking/components/SlotPicker";
import type { SlotItem } from "@/features/booking/type";

interface AdvisorActionModalProps {
  booking: AdvisorBookingItem;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdvisorActionModal({
  booking,
  onClose,
  onSuccess,
}: AdvisorActionModalProps) {
  const withinCutoff = isWithinCancelCutoff(booking.startTime);
  const [activeTab, setActiveTab] = useState<"reschedule" | "cancel">("reschedule");

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

  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slotsForSelectedDate = slots.filter((s) => s.date === selectedDate);

  const handleCancelSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await advisorApi.cancelBooking(booking.id, { reason: reason.trim() || "Cancelled by advisor" });
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to cancel booking.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedSlot) return;

    setSubmitting(true);
    setError(null);
    try {
      await advisorApi.rescheduleBooking(booking.id, {
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reason: reason.trim() || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to reschedule booking.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Manage Booking #{booking.slotId || booking.id}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {booking.internName} · {booking.eventTypeName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          {withinCutoff ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold mb-2">
                ⚠️
              </div>
              <h4 className="text-sm font-semibold text-amber-900">
                Session starts in less than {CANCEL_CUTOFF_HOURS} hours
              </h4>
              <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                Bookings starting within {CANCEL_CUTOFF_HOURS} hours cannot be rescheduled or cancelled online.
                Please contact reviewer <strong>{booking.reviewerName}</strong> directly or check your booking confirmation email.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 w-full rounded-lg bg-[#003366] py-2.5 text-xs font-semibold text-white transition hover:bg-[#003366]/90"
              >
                Got it
              </button>
            </div>
          ) : (
            <>
              {/* Tab Switcher */}
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("reschedule");
                    setError(null);
                  }}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                    activeTab === "reschedule"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Reschedule Slot
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("cancel");
                    setError(null);
                  }}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                    activeTab === "cancel"
                      ? "bg-white text-red-600 shadow-xs"
                      : "text-slate-600 hover:text-red-600"
                  }`}
                >
                  Cancel Booking
                </button>
              </div>

              {/* Session Info Summary */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                <span className="font-semibold text-slate-500 uppercase tracking-wide text-[10px]">
                  Current Time
                </span>
                <p className="font-medium text-slate-800 mt-0.5">
                  {formatBookingDate(booking.startTime)} · {formatBookingTimeRange(booking.startTime, booking.endTime)}
                </p>
              </div>

              {activeTab === "reschedule" && (
                <div className="space-y-4">
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
                    bookingWindowDays={booking.bookingWindowDays ?? 14}
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
                    <div className="space-y-3">
                      <div className="rounded-xl border border-[#003366]/30 bg-[#003366]/5 p-3 text-xs">
                        <p className="font-semibold text-[#003366]">
                          New Slot: {dayjs(selectedSlot.date).format("MMM D, YYYY")} at{" "}
                          {dayjs(`2000-01-01T${selectedSlot.startTime}`).format("h:mm A")}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Reason for Rescheduling (Optional)
                        </label>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="e.g. Mandatory session clash..."
                          rows={2}
                          className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-[#003366] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={handleRescheduleSubmit}
                      disabled={!selectedSlot || submitting}
                      className="rounded-lg bg-[#003366] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#003366]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? "Rescheduling..." : "Confirm Reschedule"}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "cancel" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reason for Cancellation
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Please state why you are cancelling this session..."
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-red-500 focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      The reviewer and intern will receive a cancellation notice with this reason.
                    </p>
                  </div>

                  {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Keep Session
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelSubmit}
                      disabled={submitting}
                      className="rounded-lg bg-red-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? "Cancelling..." : "Confirm Cancellation"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
