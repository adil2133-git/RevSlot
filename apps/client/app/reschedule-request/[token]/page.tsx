"use client";

import { use, useEffect, useState } from "react";
import dayjs from "dayjs";
import MonthCalendar from "@/features/booking/components/MonthCalendar";
import SlotPicker from "@/features/booking/components/SlotPicker";
import { useAvailableSlots } from "@/features/booking/hooks/useAvailableSlots";
import { fetchRescheduleRequestByToken, respondToRescheduleRequest } from "@/features/booking/api/bookingApi";
import type { RescheduleRequestDetail, SlotItem } from "@/features/booking/type";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function RescheduleRequestPage({ params }: PageProps) {
  const { token } = use(params);

  const [detail, setDetail] = useState<RescheduleRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<"view" | "counter" | "decline">("view");
  const [declineReason, setDeclineReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completedState, setCompletedState] = useState<"accepted" | "countered" | "declined" | null>(null);

  // Counter slot selection state
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [use12Hour, setUse12Hour] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchRescheduleRequestByToken(token);
        setDetail(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reschedule request.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  // Load available slots if Advisor chooses "counter" mode
  const {
    visibleMonth,
    setVisibleMonth,
    slots,
    slotsLoading,
    calendarDays,
    availableCountByDate,
  } = useAvailableSlots(detail?.eventType.id ?? 0);

  const slotsForSelectedDate = slots.filter((s) => s.date === selectedDate);

  const handleAccept = async () => {
    if (!detail) return;
    setSubmitting(true);
    setError(null);
    try {
      await respondToRescheduleRequest(token, { action: "accept" });
      setCompletedState("accepted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept reschedule.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCounterSubmit = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      await respondToRescheduleRequest(token, {
        action: "counter",
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });
      setCompletedState("countered");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit new time selection.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeclineSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await respondToRescheduleRequest(token, {
        action: "decline",
        declineReason: declineReason.trim() || "Reschedule request declined by advisor",
      });
      setCompletedState("declined");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decline reschedule request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading Reschedule Request...</p>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-slate-200 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 text-xl">
            ⚠️
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Request Unavailable</h1>
          <p className="text-sm text-slate-600 mb-6">{error || "This reschedule request link is invalid or has expired."}</p>
          <a
            href="/"
            className="inline-block rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  const { booking, reviewer, eventType } = detail;

  if (completedState) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
          {completedState === "accepted" && (
            <>
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 text-2xl">
                ✓
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Reschedule Confirmed!</h2>
              <p className="text-sm text-slate-600 mb-6">
                You have accepted the proposed time for <strong>{eventType.name}</strong> with <strong>{reviewer.name}</strong>.
              </p>
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-4 text-left mb-6 text-sm text-emerald-900">
                <p className="font-semibold">New Session Time:</p>
                <p className="mt-1">
                  {dayjs(booking.proposedStartTime).format("dddd, MMMM D, YYYY")} at{" "}
                  {dayjs(booking.proposedStartTime).format("h:mm A")} – {dayjs(booking.proposedEndTime).format("h:mm A")}
                </p>
              </div>
            </>
          )}

          {completedState === "countered" && (
            <>
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 text-2xl">
                ✓
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">New Time Confirmed!</h2>
              <p className="text-sm text-slate-600 mb-6">
                Your selected date & time for <strong>{eventType.name}</strong> with <strong>{reviewer.name}</strong> has been saved.
              </p>
              {selectedSlot && (
                <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-4 text-left mb-6 text-sm text-blue-900">
                  <p className="font-semibold">Confirmed Session Time:</p>
                  <p className="mt-1">
                    {dayjs(selectedSlot.date).format("dddd, MMMM D, YYYY")} at{" "}
                    {dayjs(`2000-01-01T${selectedSlot.startTime}`).format("h:mm A")} –{" "}
                    {dayjs(`2000-01-01T${selectedSlot.endTime}`).format("h:mm A")}
                  </p>
                </div>
              )}
            </>
          )}

          {completedState === "declined" && (
            <>
              <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 text-2xl">
                ✕
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Cancelled</h2>
              <p className="text-sm text-slate-600 mb-6">
                You have declined the reschedule request for <strong>{eventType.name}</strong>. The booking has been cancelled and notification emails sent.
              </p>
            </>
          )}

          <p className="text-xs text-slate-500">You may close this browser window now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Branding */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-lg">
              R
            </div>
            <span className="font-bold text-xl text-slate-900">RevSlot</span>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
            Reschedule Request Action
          </span>
        </div>

        {/* Card Body */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reschedule Request from Reviewer</h1>
            <p className="text-sm text-slate-500 mt-1">
              Reviewer <strong>{reviewer.name}</strong> has asked to reschedule your review session for <strong>{booking.internName}</strong> ({booking.batch}).
            </p>
          </div>

          {/* Reason Note from Reviewer */}
          {booking.rescheduleReason && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-1">Message from Reviewer:</p>
              <p className="text-sm text-amber-900">"{booking.rescheduleReason}"</p>
            </div>
          )}

          {/* Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Current Time</p>
              <p className="font-semibold text-slate-700 line-through">
                {dayjs(booking.startTime).format("ddd, MMM D, YYYY")}
              </p>
              <p className="text-sm text-slate-500 line-through">
                {dayjs(booking.startTime).format("h:mm A")} – {dayjs(booking.endTime).format("h:mm A")}
              </p>
            </div>

            <div className="rounded-xl border-2 border-primary/40 p-4 bg-primary/5">
              <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Proposed New Time</p>
              <p className="font-bold text-primary text-base">
                {dayjs(booking.proposedStartTime).format("ddd, MMM D, YYYY")}
              </p>
              <p className="text-sm font-semibold text-primary/80">
                {dayjs(booking.proposedStartTime).format("h:mm A")} – {dayjs(booking.proposedEndTime).format("h:mm A")}
              </p>
            </div>
          </div>

          {error && <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-200">{error}</p>}

          {/* Mode Action Sections */}
          {mode === "view" && (
            <div className="space-y-4 pt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Choose an option below:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={handleAccept}
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90 transition shadow-2xs flex flex-col items-center justify-center text-center gap-1"
                >
                  <span>✓ Accept New Time</span>
                </button>

                <button
                  onClick={() => setMode("counter")}
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl bg-slate-100 text-slate-800 font-semibold text-sm hover:bg-slate-200 transition flex flex-col items-center justify-center text-center gap-1"
                >
                  <span>📅 Pick Another Slot</span>
                </button>

                <button
                  onClick={() => setMode("decline")}
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-sm hover:bg-rose-100 transition flex flex-col items-center justify-center text-center gap-1"
                >
                  <span>✕ Decline Request</span>
                </button>
              </div>
            </div>
          )}

          {/* Mode B: Counter - Pick another slot */}
          {mode === "counter" && (
            <div className="space-y-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg">Select an Alternative Time Slot</h3>
                <button
                  onClick={() => setMode("view")}
                  className="text-xs text-slate-500 hover:text-slate-900 underline"
                >
                  Back to options
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Pick a slot from Reviewer <strong>{reviewer.name}</strong>'s available schedule that works for you:
              </p>

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
                bookingWindowDays={detail.eventType.durationMinutes}
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
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-900">
                    Selected Slot: {dayjs(selectedSlot.date).format("MMM D, YYYY")} at{" "}
                    {dayjs(`2000-01-01T${selectedSlot.startTime}`).format("h:mm A")}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setMode("view")}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCounterSubmit}
                  disabled={!selectedSlot || submitting}
                  className="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Confirming..." : "Confirm Selected Time"}
                </button>
              </div>
            </div>
          )}

          {/* Mode C: Decline */}
          {mode === "decline" && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg">Decline & Cancel Booking</h3>
                <button
                  onClick={() => setMode("view")}
                  className="text-xs text-slate-500 hover:text-slate-900 underline"
                >
                  Back to options
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Are you sure you want to decline this reschedule request? Declining will cancel the booking.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Optional Reason for Declining
                </label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="e.g. Neither the proposed time nor other slots fit our availability..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setMode("view")}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeclineSubmit}
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50"
                >
                  {submitting ? "Declining..." : "Decline & Cancel Session"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
