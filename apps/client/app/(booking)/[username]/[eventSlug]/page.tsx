"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dayjs from "@/lib/dayjs";

import { useBookingPageInfo } from "@/features/booking/hooks/useBookingPageInfo";
import { useAvailableSlots } from "@/features/booking/hooks/useAvailableSlots";
import { useSlotHold } from "@/features/booking/hooks/useSlotHold";
import { useBookingForm } from "@/features/booking/hooks/useBookingForm";
import TimezoneSelect from "@/features/availability/components/TimezoneSelect";
import { convertSlotsToTimezone } from "@/features/booking/utils";

import LoadingSkeleton from "@/features/booking/components/LoadingSkeleton";
import ErrorState from "@/features/booking/components/ErrorState";
import BookingConfirmation from "@/features/booking/components/BookingConfirmation";
import StepIndicator from "@/features/booking/components/StepIndicator";
import ReviewerInfoPanel from "@/features/booking/components/ReviewerInfoPanel";
import MonthCalendar from "@/features/booking/components/MonthCalendar";
import SlotPicker from "@/features/booking/components/SlotPicker";
import TimeSelectedCard from "@/features/booking/components/TimeSelectedCard";
import BookingForm from "@/features/booking/components/BookingForm";
import PoweredByFooter from "@/features/booking/components/PoweredByFooter";

export default function PublicBookingPage() {
  const params = useParams<{ username: string; eventSlug: string }>();
  const username = params.username;
  const eventSlug = params.eventSlug;

  const { pageInfo, pageError, pageLoading } = useBookingPageInfo(
    username,
    eventSlug
  );

  const [clientTimezone, setClientTimezone] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
    } catch {
      return "Asia/Kolkata";
    }
  });

  const {
    visibleMonth,
    setVisibleMonth,
    slots,
    slotsLoading,
    calendarDays,
    loadSlots,
  } = useAvailableSlots(pageInfo?.eventType.id);

  const reviewerTimezone = pageInfo?.eventType.timezone || "Asia/Kolkata";

  const displaySlots = useMemo(() => {
    return convertSlotsToTimezone(slots, reviewerTimezone, clientTimezone);
  }, [slots, reviewerTimezone, clientTimezone]);

  const displayAvailableCountByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of displaySlots) {
      counts[s.date] = (counts[s.date] ?? 0) + 1;
    }
    return counts;
  }, [displaySlots]);

  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [use12Hour, setUse12Hour] = useState(true);

  const {
    holdResult,
    heldSlot,
    holdError,
    holding,
    secondsLeft,
    showDetailsForm,
    setShowDetailsForm,
    handleSelectSlot,
    resetSelection,
  } = useSlotHold(loadSlots);

  const {
    register,
    onSubmit,
    errors,
    advisorEmail,
    submitting,
    submitError,
    bookingDone,
    meetLink,
    fields,
    selectedFieldKeys,
    addField,
    removeField,
  } = useBookingForm(holdResult, {
    price: pageInfo?.eventType.price ?? 0,
    eventTypeName: pageInfo?.eventType.name ?? "",
    reviewerName: pageInfo?.reviewer.name ?? "",
    clientTimezone,
  });
  
  const currentStep = bookingDone ? 3 : showDetailsForm ? 2 : 1;
  const slotsForSelectedDate = useMemo(() => {
    return displaySlots.filter((s) => s.date === selectedDate);
  }, [displaySlots, selectedDate]);

  if (pageLoading) return <LoadingSkeleton />;
  if (pageError || !pageInfo) return <ErrorState message={pageError} />;

  if (bookingDone) {
    return (
      <BookingConfirmation
        pageInfo={pageInfo}
        heldSlot={heldSlot}
        advisorEmail={advisorEmail}
        use12Hour={use12Hour}
        meetLink={meetLink}
        clientTimezone={clientTimezone}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-4xl">
        <div className="mb-4 flex justify-end">
          <Link
            href="/my-bookings"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface-card px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-primary hover:text-primary"
          >
            Check My Bookings ➔
          </Link>
        </div>
        <StepIndicator currentStep={currentStep} />

        <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-surface-card shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] md:divide-x md:divide-slate-200">
            <ReviewerInfoPanel pageInfo={pageInfo} />

            <div className="p-8">
              {!holdResult && (
                <>
                  <MonthCalendar
                    visibleMonth={visibleMonth}
                    setVisibleMonth={setVisibleMonth}
                    calendarDays={calendarDays}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    availableCountByDate={displayAvailableCountByDate}
                    bookingWindowDays={pageInfo.eventType.bookingWindowDays}
                  />

                  <div className="my-5 border-t border-b border-slate-100 py-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9 4.5 4.03 4.5 9-2.015 9-4.5 9zM3.5 12h17" />
                        </svg>
                        <span>Time zone</span>
                      </div>
                      <div className="w-full sm:w-72">
                        <TimezoneSelect value={clientTimezone} onChange={setClientTimezone} />
                      </div>
                    </div>
                  </div>

                  <SlotPicker
                    selectedDate={selectedDate}
                    use12Hour={use12Hour}
                    setUse12Hour={setUse12Hour}
                    slotsLoading={slotsLoading}
                    slotsForSelectedDate={slotsForSelectedDate}
                    holding={holding}
                    holdError={holdError}
                    onSelectSlot={handleSelectSlot}
                  />
                </>
              )}

              {holdResult && heldSlot && !showDetailsForm && (
                <TimeSelectedCard
                  heldSlot={heldSlot}
                  use12Hour={use12Hour}
                  secondsLeft={secondsLeft}
                  onChange={resetSelection}
                  onContinue={() => setShowDetailsForm(true)}
                />
              )}

              {holdResult && showDetailsForm && (
                <BookingForm
                  fields={fields}
                  selectedFieldKeys={selectedFieldKeys}
                  addField={addField}
                  removeField={removeField}
                  register={register}
                  errors={errors}
                  submitting={submitting}
                  submitError={submitError}
                  secondsLeft={secondsLeft}
                  price={pageInfo.eventType.price}
                  onSubmit={onSubmit}
                  onBack={() => setShowDetailsForm(false)}
                />
              )}
            </div>
          </div>
        </div>
        <PoweredByFooter />
      </div>
    </div>
  );
}
