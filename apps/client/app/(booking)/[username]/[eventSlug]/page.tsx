"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import dayjs from "dayjs";

import { useBookingPageInfo } from "@/features/booking/hooks/useBookingPageInfo";
import { useAvailableSlots } from "@/features/booking/hooks/useAvailableSlots";
import { useSlotHold } from "@/features/booking/hooks/useSlotHold";
import { useBookingForm } from "@/features/booking/hooks/useBookingForm";

import LoadingSkeleton from "@/features/booking/components/LoadingSkeleton";
import ErrorState from "@/features/booking/components/ErrorState";
import BookingConfirmation from "@/features/booking/components/BookingConfirmation";
import StepIndicator from "@/features/booking/components/StepIndicator";
import ReviewerInfoPanel from "@/features/booking/components/ReviewerInfoPanel";
import MonthCalendar from "@/features/booking/components/MonthCalender";
import SlotPicker from "@/features/booking/components/SlotPicker";
import TimeSelectedCard from "@/features/booking/components/TimeSelectedCard";
import BookingForm from "@/features/booking/components/BookingForm";

export default function PublicBookingPage() {
  const params = useParams<{ username: string; eventSlug: string }>();
  const username = params.username;
  const eventSlug = params.eventSlug;

  const { pageInfo, pageError, pageLoading } = useBookingPageInfo(
    username,
    eventSlug
  );

  const {
    visibleMonth,
    setVisibleMonth,
    slots,
    slotsLoading,
    calendarDays,
    availableCountByDate,
    loadSlots,
  } = useAvailableSlots(pageInfo?.eventType.id);

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
    errors,
    advisorEmail,
    submitting,
    submitError,
    bookingDone,
    onSubmit,
  } = useBookingForm(holdResult);

  const currentStep = bookingDone ? 3 : showDetailsForm ? 2 : 1;
  const slotsForSelectedDate = slots.filter((s) => s.date === selectedDate);

  if (pageLoading) return <LoadingSkeleton />;
  if (pageError || !pageInfo) return <ErrorState message={pageError} />;

  if (bookingDone) {
    return (
      <BookingConfirmation
        pageInfo={pageInfo}
        heldSlot={heldSlot}
        advisorEmail={advisorEmail}
        use12Hour={use12Hour}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-4xl">
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
                    availableCountByDate={availableCountByDate}
                    bookingWindowDays={pageInfo.eventType.bookingWindowDays}
                  />
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
                  register={register}
                  errors={errors}
                  submitting={submitting}
                  submitError={submitError}
                  secondsLeft={secondsLeft}
                  onSubmit={onSubmit}
                  onBack={() => setShowDetailsForm(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
