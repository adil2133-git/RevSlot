"use client";

import { useState } from "react";
import dayjs from "dayjs";
import type { AdvisorBookingItem } from "../types";
import { advisorApi } from "../services/advisorApi";
import { isWithinCancelCutoff, CANCEL_CUTOFF_HOURS, formatBookingDate, formatBookingTimeRange } from "@/features/booking/utils/bookingDisplay";
import { useAvailableSlots } from "@/features/booking/hooks/useAvailableSlots";
import MonthCalendar from "@/features/booking/components/MonthCalendar";
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

  const hoursUntilStart = dayjs(booking.startTime).diff(dayjs(), "hour", true);
  const isPaid = (booking.price && booking.price > 0) || (booking.paymentAmount && booking.paymentAmount > 0);
  const amount = booking.paymentAmount ? booking.paymentAmount / 100 : (booking.price || 0);
  const reschedulesUsed = booking.rescheduleCount || 0;
  const isRescheduleLimitReached = reschedulesUsed >= 1;
  const isRescheduledSession = reschedulesUsed > 0;
  const isNonRefundable = isRescheduledSession && isPaid;
  const isFullRefund = !isRescheduledSession && hoursUntilStart > 8;
  const isPartialRefund = !isRescheduledSession && hoursUntilStart <= 8 && hoursUntilStart >= 3;
  const cancellationFeeAmount = isNonRefundable
    ? amount
    : isPartialRefund
    ? Math.round(amount * 0.15)
    : 0;
  const refundAmountEstimate = isNonRefundable
    ? 0
    : isPartialRefund
    ? amount - cancellationFeeAmount
    : amount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Manage Booking #{booking.slotId || booking.id}
              </h3>
              {isPaid ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  Paid ₹{amount}
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  Free
                </span>
              )}
            </div>
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
                  Reschedule Slot {reschedulesUsed > 0 ? `(${reschedulesUsed}/1)` : ""}
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
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wide text-[10px]">
                    Current Scheduled Time
                  </span>
                  <p className="font-medium text-slate-800 mt-0.5">
                    {formatBookingDate(booking.startTime)} · {formatBookingTimeRange(booking.startTime, booking.endTime)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-500 uppercase tracking-wide text-[10px]">
                    Payment
                  </span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {isPaid ? `₹${amount} (Paid)` : "Free"}
                  </p>
                </div>
              </div>

              {activeTab === "reschedule" && (
                <div className="space-y-4">
                  {isRescheduleLimitReached ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-rose-900 text-sm">
                        <span>⚠️</span> Maximum Reschedules Reached
                      </p>
                      <p className="leading-relaxed text-rose-700">
                        This booking has already been rescheduled ({reschedulesUsed}/1). Clients are permitted 1 reschedule per booking. If you cannot attend this session, please cancel or reach out to reviewer <strong>{booking.reviewerName}</strong> directly.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-950">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="flex items-center gap-1.5 text-emerald-800">
                            <span>✨</span> Rescheduling is 100% Free
                          </span>
                          <span className="text-[11px] font-medium text-emerald-700">
                            1 of 1 reschedule left
                          </span>
                        </div>
                        {isPaid && (
                          <p className="mt-1 text-[11px] text-emerald-700">
                            Your payment of ₹{amount} automatically transfers over to your newly chosen slot.
                          </p>
                        )}
                      </div>

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
                    </>
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
                    {!isRescheduleLimitReached && (
                      <button
                        type="button"
                        onClick={handleRescheduleSubmit}
                        disabled={!selectedSlot || submitting}
                        className="rounded-lg bg-[#003366] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#003366]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? "Rescheduling..." : "Confirm Reschedule"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "cancel" && (
                <div className="space-y-4">
                  {/* Refund Policy & Calculation Card */}
                  {isPaid ? (
                    <div
                      className={`rounded-xl border p-3.5 text-xs ${
                        isNonRefundable
                          ? "border-amber-200 bg-amber-50/90 text-amber-950"
                          : isFullRefund
                          ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
                          : "border-amber-200 bg-amber-50/80 text-amber-950"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <span>{isNonRefundable ? "⚠️" : isFullRefund ? "✅" : "⚠️"}</span>
                          {isNonRefundable
                            ? "Non-Refundable Cancellation"
                            : isFullRefund
                            ? "100% Full Refund Eligible"
                            : "Partial Refund (85%)"}
                        </span>
                        <span className="text-sm font-bold">
                          {isNonRefundable ? "₹0 Refund" : `₹${refundAmountEstimate} to be refunded`}
                        </span>
                      </div>

                      <div className="mt-2.5 space-y-1 text-[11px] border-t pt-2 border-slate-200/50">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Original Payment:</span>
                          <span className="font-semibold text-slate-900">₹{amount}</span>
                        </div>
                        {isNonRefundable && (
                          <div className="flex justify-between text-amber-900 font-medium">
                            <span>Rescheduled Session Policy:</span>
                            <span className="font-semibold">-₹{amount} (Non-refundable)</span>
                          </div>
                        )}
                        {!isNonRefundable && isPartialRefund && (
                          <div className="flex justify-between text-amber-800">
                            <span>Cancellation Fee (15% within 3–8h):</span>
                            <span className="font-semibold">-₹{cancellationFeeAmount}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200/50">
                          <span>Net Refund Amount:</span>
                          <span className={isNonRefundable ? "text-amber-900" : isFullRefund ? "text-emerald-700" : "text-amber-900"}>
                            ₹{refundAmountEstimate}
                          </span>
                        </div>
                      </div>

                      <p className="mt-2 text-[11px] opacity-85 leading-relaxed">
                        {isNonRefundable
                          ? "Because this booking was already rescheduled once, you may cancel to free the reviewer's schedule, but your payment of ₹" + amount + " is strictly non-refundable and is transferred to the reviewer as compensation."
                          : isFullRefund
                          ? "Because you are cancelling more than 8 hours before the session, a full 100% refund will be automatically dispatched to your original payment method via Razorpay within 5–7 business days."
                          : "Because you are cancelling within 3 to 8 hours before the session, a 15% cancellation fee is retained. An 85% refund will be dispatched to your original payment method via Razorpay within 5–7 business days."}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                      <span className="font-semibold">Free Session:</span> This booking was free. No cancellation fee applies.
                    </div>
                  )}

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
