// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { useParams } from "next/navigation";
// import dayjs from "dayjs";
// import {
//   fetchBookingPageInfo,
//   fetchAvailableSlots,
//   holdSlot,
//   createBooking,
// } from "@/features/booking/api/bookingApi";
// import type { BookingPageInfo, SlotItem, HoldResult } from "@/features/booking/type";

// const DAYS_TO_SHOW = 14;

// export default function PublicBookingPage() {
//   const params = useParams<{ reviewerId: string; eventSlug: string }>();
//   const reviewerId = Number(params.reviewerId);
//   const eventSlug = params.eventSlug;

//   // Page info (reviewer + event type)
//   const [pageInfo, setPageInfo] = useState<BookingPageInfo | null>(null);
//   const [pageError, setPageError] = useState<string | null>(null);
//   const [pageLoading, setPageLoading] = useState(true);

//   // Slots
//   const [slots, setSlots] = useState<SlotItem[]>([]);
//   const [slotsLoading, setSlotsLoading] = useState(false);
//   const [selectedDate, setSelectedDate] = useState<string>(
//     dayjs().format("YYYY-MM-DD")
//   );

//   // Hold + booking form
//   const [holdResult, setHoldResult] = useState<HoldResult | null>(null);
//   const [holdError, setHoldError] = useState<string | null>(null);
//   const [holding, setHolding] = useState(false);
//   const [secondsLeft, setSecondsLeft] = useState(0);

//   const [form, setForm] = useState({
//     advisorName: "",
//     advisorEmail: "",
//     internName: "",
//     batch: "",
//     internEmails: "",
//     weekStage: "",
//   });
//   const [submitting, setSubmitting] = useState(false);
//   const [submitError, setSubmitError] = useState<string | null>(null);
//   const [bookingDone, setBookingDone] = useState(false);

//   const dateOptions = useMemo(() => {
//     return Array.from({ length: DAYS_TO_SHOW }, (_, i) =>
//       dayjs().add(i, "day").format("YYYY-MM-DD")
//     );
//   }, []);

//   // 1. Load reviewer + event type info
//   useEffect(() => {
//     if (!reviewerId || !eventSlug) return;

//     setPageLoading(true);
//     fetchBookingPageInfo(reviewerId, eventSlug)
//       .then(setPageInfo)
//       .catch((err: Error) => setPageError(err.message))
//       .finally(() => setPageLoading(false));
//   }, [reviewerId, eventSlug]);

//   // 2. Load available slots once we know the event type
//   const loadSlots = () => {
//     if (!pageInfo) return;
//     setSlotsLoading(true);
//     fetchAvailableSlots(
//       pageInfo.eventType.id,
//       dateOptions[0],
//       dateOptions[dateOptions.length - 1]
//     )
//       .then(setSlots)
//       .catch(() => setSlots([]))
//       .finally(() => setSlotsLoading(false));
//   };

//   useEffect(() => {
//     loadSlots();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [pageInfo]);

//   // 3. Countdown timer for the active hold
//   useEffect(() => {
//     if (!holdResult) return;

//     const tick = () => {
//       const remaining = dayjs(holdResult.holdExpiresAt).diff(dayjs(), "second");
//       setSecondsLeft(Math.max(remaining, 0));
//       if (remaining <= 0) {
//         setHoldResult(null);
//         setHoldError("Your hold expired — please pick a slot again.");
//         loadSlots();
//       }
//     };

//     tick();
//     const interval = setInterval(tick, 1000);
//     return () => clearInterval(interval);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [holdResult]);

//   const slotsForSelectedDate = slots.filter((s) => s.slotDate === selectedDate);

//   const handleSelectSlot = async (slot: SlotItem) => {
//     setHoldError(null);
//     setHolding(true);
//     try {
//       const result = await holdSlot(slot.id);
//       setHoldResult(result);
//     } catch (err) {
//       setHoldError(err instanceof Error ? err.message : "Could not hold this slot");
//       loadSlots();
//     } finally {
//       setHolding(false);
//     }
//   };

//   const handleSubmitBooking = async () => {
//     if (!holdResult) return;
//     setSubmitError(null);
//     setSubmitting(true);
//     try {
//       await createBooking({
//         holdToken: holdResult.holdToken,
//         advisorName: form.advisorName,
//         advisorEmail: form.advisorEmail,
//         internName: form.internName,
//         batch: form.batch,
//         weekStage: form.weekStage,
//         internEmails: form.internEmails
//           ? form.internEmails.split(",").map((e) => e.trim()).filter(Boolean)
//           : undefined,
//       });
//       setBookingDone(true);
//     } catch (err) {
//       setSubmitError(
//         err instanceof Error ? err.message : "Could not confirm the booking"
//       );
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   if (pageLoading) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-surface">
//         <p className="text-sm text-slate-600">Loading...</p>
//       </div>
//     );
//   }

//   if (pageError || !pageInfo) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-surface">
//         <p className="text-sm text-slate-600">
//           {pageError ?? "This booking page is not available."}
//         </p>
//       </div>
//     );
//   }

//   if (bookingDone) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-surface">
//         <div className="max-w-md rounded-xl border border-slate-200 bg-surface-card p-8 text-center">
//           <h1 className="mb-2 text-xl font-semibold text-on-surface">
//             Booking confirmed!
//           </h1>
//           <p className="text-sm text-slate-600">
//             A confirmation has been sent to {form.advisorEmail}.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="mx-auto min-h-screen max-w-3xl bg-surface px-4 py-10">
//       <div className="mb-8">
//         <h1 className="text-2xl font-semibold tracking-tight text-on-surface">
//           {pageInfo.eventType.name}
//         </h1>
//         <p className="mt-1 text-sm text-slate-600">
//           with {pageInfo.reviewer.name} · {pageInfo.eventType.durationMinutes} min
//         </p>
//         {pageInfo.eventType.description && (
//           <p className="mt-2 text-sm text-slate-600">{pageInfo.eventType.description}</p>
//         )}
//       </div>

//       {!holdResult && (
//         <>
//           {/* Date picker */}
//           <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
//             {dateOptions.map((date) => (
//               <button
//                 key={date}
//                 onClick={() => setSelectedDate(date)}
//                 className={`shrink-0 rounded-lg border px-3 py-2 text-sm ${
//                   selectedDate === date
//                     ? "border-slate-900 bg-slate-900 text-white"
//                     : "border-slate-300 bg-surface-card text-on-surface"
//                 }`}
//               >
//                 {dayjs(date).format("ddd, MMM D")}
//               </button>
//             ))}
//           </div>

//           {/* Slot list */}
//           {slotsLoading ? (
//             <p className="text-sm text-slate-600">Loading available times...</p>
//           ) : slotsForSelectedDate.length === 0 ? (
//             <p className="text-sm text-slate-600">No available times on this date.</p>
//           ) : (
//             <div className="grid grid-cols-3 gap-2">
//               {slotsForSelectedDate.map((slot) => (
//                 <button
//                   key={slot.id}
//                   disabled={holding}
//                   onClick={() => handleSelectSlot(slot)}
//                   className="rounded-lg border border-slate-300 bg-surface-card px-3 py-2 text-sm text-on-surface hover:border-slate-900 disabled:opacity-50"
//                 >
//                   {slot.startTime.slice(0, 5)}
//                 </button>
//               ))}
//             </div>
//           )}

//           {holdError && (
//             <p className="mt-4 text-sm text-red-600">{holdError}</p>
//           )}
//         </>
//       )}

//       {/* Booking form — shown once a slot is held */}
//       {holdResult && (
//         <div className="rounded-xl border border-slate-200 bg-surface-card p-6">
//           <div className="mb-4 flex items-center justify-between">
//             <p className="text-sm font-medium text-on-surface">
//               Slot held — complete the form below
//             </p>
//             <p className="text-sm text-slate-600">
//               Expires in {Math.floor(secondsLeft / 60)}:
//               {String(secondsLeft % 60).padStart(2, "0")}
//             </p>
//           </div>

//           <div className="space-y-3">
//             <input
//               className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
//               placeholder="Advisor name"
//               value={form.advisorName}
//               onChange={(e) => setForm({ ...form, advisorName: e.target.value })}
//             />
//             <input
//               className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
//               placeholder="Advisor email"
//               type="email"
//               value={form.advisorEmail}
//               onChange={(e) => setForm({ ...form, advisorEmail: e.target.value })}
//             />
//             <input
//               className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
//               placeholder="Intern name"
//               value={form.internName}
//               onChange={(e) => setForm({ ...form, internName: e.target.value })}
//             />
//             <input
//               className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
//               placeholder="Batch"
//               value={form.batch}
//               onChange={(e) => setForm({ ...form, batch: e.target.value })}
//             />
//             <input
//               className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
//               placeholder="Intern email(s), comma separated — optional"
//               value={form.internEmails}
//               onChange={(e) => setForm({ ...form, internEmails: e.target.value })}
//             />
//             <input
//               className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
//               placeholder="Week / stage"
//               value={form.weekStage}
//               onChange={(e) => setForm({ ...form, weekStage: e.target.value })}
//             />
//           </div>

//           {submitError && (
//             <p className="mt-3 text-sm text-red-600">{submitError}</p>
//           )}

//           <div className="mt-5 flex gap-2">
//             <button
//               onClick={handleSubmitBooking}
//               disabled={submitting}
//               className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
//             >
//               {submitting ? "Confirming..." : "Confirm booking"}
//             </button>
//             <button
//               onClick={() => {
//                 setHoldResult(null);
//                 loadSlots();
//               }}
//               className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-on-surface"
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }





"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import dayjs from "dayjs";
import {
  fetchBookingPageInfo,
  fetchAvailableSlots,
  holdSlot,
  createBooking,
} from "@/features/booking/api/bookingApi";
import type { BookingPageInfo, SlotItem, HoldResult } from "@/features/booking/type";

const DAYS_TO_SHOW = 14;

export default function PublicBookingPage() {
  const params = useParams<{ reviewerId: string; eventSlug: string }>();
  const reviewerId = Number(params.reviewerId);
  const eventSlug = params.eventSlug;

  // Page info (reviewer + event type)
  const [pageInfo, setPageInfo] = useState<BookingPageInfo | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Slots
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    dayjs().format("YYYY-MM-DD")
  );

  // Hold + booking form
  const [holdResult, setHoldResult] = useState<HoldResult | null>(null);
  const [heldSlot, setHeldSlot] = useState<SlotItem | null>(null);
  const [holdError, setHoldError] = useState<string | null>(null);
  const [holding, setHolding] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const [form, setForm] = useState({
    advisorName: "",
    advisorEmail: "",
    internName: "",
    batch: "",
    internEmails: "",
    weekStage: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingDone, setBookingDone] = useState(false);

  const dateOptions = useMemo(() => {
    return Array.from({ length: DAYS_TO_SHOW }, (_, i) =>
      dayjs().add(i, "day").format("YYYY-MM-DD")
    );
  }, []);

  // 1. Load reviewer + event type info
  useEffect(() => {
    // reviewerId/eventSlug can be invalid (e.g. NaN from a malformed URL) —
    // bail out with a clear error instead of hanging on "Loading..." forever
    if (!reviewerId || Number.isNaN(reviewerId) || !eventSlug) {
      setPageError("This booking link looks invalid.");
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    fetchBookingPageInfo(reviewerId, eventSlug)
      .then(setPageInfo)
      .catch((err: Error) => setPageError(err.message))
      .finally(() => setPageLoading(false));
  }, [reviewerId, eventSlug]);

  // 2. Load available slots once we know the event type
  const loadSlots = () => {
    if (!pageInfo) return;
    setSlotsLoading(true);
    fetchAvailableSlots(
      pageInfo.eventType.id,
      dateOptions[0],
      dateOptions[dateOptions.length - 1]
    )
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  };

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageInfo]);

  // 3. Countdown timer for the active hold
  useEffect(() => {
    if (!holdResult) return;

    const tick = () => {
      const remaining = dayjs(holdResult.holdExpiresAt).diff(dayjs(), "second");
      setSecondsLeft(Math.max(remaining, 0));
      if (remaining <= 0) {
        setHoldResult(null);
        setHeldSlot(null);
        setHoldError("Your hold expired — please pick a slot again.");
        loadSlots();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdResult]);

  const slotsForSelectedDate = slots.filter((s) => s.slotDate === selectedDate);

  const handleSelectSlot = async (slot: SlotItem) => {
    setHoldError(null);
    setHolding(true);
    try {
      const result = await holdSlot(slot.id);
      setHoldResult(result);
      setHeldSlot(slot);
    } catch (err) {
      setHoldError(err instanceof Error ? err.message : "Could not hold this slot");
      loadSlots();
    } finally {
      setHolding(false);
    }
  };

  const handleSubmitBooking = async () => {
    if (!holdResult) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await createBooking({
        holdToken: holdResult.holdToken,
        advisorName: form.advisorName,
        advisorEmail: form.advisorEmail,
        internName: form.internName,
        batch: form.batch,
        weekStage: form.weekStage,
        internEmails: form.internEmails
          ? form.internEmails.split(",").map((e) => e.trim()).filter(Boolean)
          : undefined,
      });
      setBookingDone(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Could not confirm the booking"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-sm text-slate-600">Loading...</p>
      </div>
    );
  }

  if (pageError || !pageInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-sm text-slate-600">
          {pageError ?? "This booking page is not available."}
        </p>
      </div>
    );
  }

  if (bookingDone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="max-w-md rounded-xl border border-slate-200 bg-surface-card p-8 text-center">
          <h1 className="mb-2 text-xl font-semibold text-on-surface">
            Booking confirmed!
          </h1>
          {heldSlot && (
            <p className="mt-1 text-sm font-medium text-on-surface">
              {dayjs(heldSlot.slotDate).format("ddd, MMM D")} ·{" "}
              {heldSlot.startTime.slice(0, 5)}–{heldSlot.endTime.slice(0, 5)}{" "}
              ({pageInfo.eventType.timezone})
            </p>
          )}
          <p className="mt-1 text-sm text-slate-600">
            with {pageInfo.reviewer.name}
          </p>
          <p className="mt-3 text-sm text-slate-600">
            A confirmation has been sent to {form.advisorEmail}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-surface px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-on-surface">
          {pageInfo.eventType.name}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          with {pageInfo.reviewer.name} · {pageInfo.eventType.durationMinutes} min ·{" "}
          {pageInfo.eventType.timezone}
        </p>
        {pageInfo.eventType.description && (
          <p className="mt-2 text-sm text-slate-600">{pageInfo.eventType.description}</p>
        )}
      </div>

      {!holdResult && (
        <>
          {/* Date picker */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
            {dateOptions.map((date) => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`shrink-0 rounded-lg border px-3 py-2 text-sm ${
                  selectedDate === date
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-surface-card text-on-surface"
                }`}
              >
                {dayjs(date).format("ddd, MMM D")}
              </button>
            ))}
          </div>

          {/* Slot list */}
          {slotsLoading ? (
            <p className="text-sm text-slate-600">Loading available times...</p>
          ) : slotsForSelectedDate.length === 0 ? (
            <p className="text-sm text-slate-600">No available times on this date.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slotsForSelectedDate.map((slot) => (
                <button
                  key={slot.id}
                  disabled={holding}
                  onClick={() => handleSelectSlot(slot)}
                  className="rounded-lg border border-slate-300 bg-surface-card px-3 py-2 text-sm text-on-surface hover:border-slate-900 disabled:opacity-50"
                >
                  {slot.startTime.slice(0, 5)}
                </button>
              ))}
            </div>
          )}

          {holdError && (
            <p className="mt-4 text-sm text-red-600">{holdError}</p>
          )}
        </>
      )}

      {/* Booking form — shown once a slot is held */}
      {holdResult && (
        <div className="rounded-xl border border-slate-200 bg-surface-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-on-surface">
              Slot held — complete the form below
            </p>
            <p className="text-sm text-slate-600">
              Expires in {Math.floor(secondsLeft / 60)}:
              {String(secondsLeft % 60).padStart(2, "0")}
            </p>
          </div>

          <div className="space-y-3">
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Advisor name"
              value={form.advisorName}
              onChange={(e) => setForm({ ...form, advisorName: e.target.value })}
            />
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Advisor email"
              type="email"
              value={form.advisorEmail}
              onChange={(e) => setForm({ ...form, advisorEmail: e.target.value })}
            />
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Intern name"
              value={form.internName}
              onChange={(e) => setForm({ ...form, internName: e.target.value })}
            />
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Batch"
              value={form.batch}
              onChange={(e) => setForm({ ...form, batch: e.target.value })}
            />
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Intern email(s), comma separated — optional"
              value={form.internEmails}
              onChange={(e) => setForm({ ...form, internEmails: e.target.value })}
            />
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Week / stage"
              value={form.weekStage}
              onChange={(e) => setForm({ ...form, weekStage: e.target.value })}
            />
          </div>

          {submitError && (
            <p className="mt-3 text-sm text-red-600">{submitError}</p>
          )}

          <div className="mt-5 flex gap-2">
            <button
              onClick={handleSubmitBooking}
              disabled={submitting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {submitting ? "Confirming..." : "Confirm booking"}
            </button>
            <button
              onClick={() => {
                setHoldResult(null);
                setHeldSlot(null);
                loadSlots();
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-on-surface"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}