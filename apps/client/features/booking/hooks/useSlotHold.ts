"use client";

import { useEffect, useState, useRef } from "react";
import dayjs from "dayjs";
import { holdSlot } from "../api/bookingApi";
import type { HoldResult, SlotItem } from "../type";

const RELEASE_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api") + "/slots/release";

// Fire-and-forget release. Uses sendBeacon when we're leaving the page
// (tab close / browser back navigating away) since a regular fetch can
// get cancelled mid-flight during unload; falls back to fetch keepalive
// otherwise. Either way we don't wait on the response — the advisor is
// already gone, we just don't want the row to linger in the DB.
function fireReleaseBeacon(holdToken: string) {
  const body = JSON.stringify({ holdToken });
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(RELEASE_URL, blob);
  } else {
    fetch(RELEASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }
}

export function useSlotHold(loadSlots: () => void) {
  const [holdResult, setHoldResult] = useState<HoldResult | null>(null);
  const [heldSlot, setHeldSlot] = useState<SlotItem | null>(null);
  const [holdError, setHoldError] = useState<string | null>(null);
  const [holding, setHolding] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [showDetailsForm, setShowDetailsForm] = useState(false);

// Mirrors holdResult so the beforeunload/unmount handlers below always
// see the latest token without re-subscribing on every render.
const holdResultRef = useRef<HoldResult | null>(null);
useEffect(() => {
  holdResultRef.current = holdResult;
}, [holdResult]);

// Safety net for the browser back button / tab close / hard navigation —
// resetSelection() covers the in-app "Change" click, this covers leaving
// the page entirely while a hold is still active.
useEffect(() => {
  const releaseActiveHold = () => {
    const active = holdResultRef.current;
    if (active) fireReleaseBeacon(active.holdToken);
  };

  window.addEventListener("pagehide", releaseActiveHold);
  window.addEventListener("beforeunload", releaseActiveHold);

  return () => {
    // Component unmounting (e.g. SPA navigation away) without an unload
    // event — release then too.
    releaseActiveHold();
    window.removeEventListener("pagehide", releaseActiveHold);
    window.removeEventListener("beforeunload", releaseActiveHold);
  };
}, []);

  // Countdown timer for the active hold
  useEffect(() => {
    if (!holdResult) return;

    const tick = () => {
      const remaining = dayjs(holdResult.holdExpiresAt).diff(dayjs(), "second");
      setSecondsLeft(Math.max(remaining, 0));
      if (remaining <= 0) {
        setHoldResult(null);
        setHeldSlot(null);
        setShowDetailsForm(false);
        setHoldError("Your hold expired — please pick a slot again.");
        loadSlots();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdResult]);

  const handleSelectSlot = async (slot: SlotItem) => {
    setHoldError(null);
    setHolding(true);
    try {
      const result = await holdSlot({
  eventTypeId: slot.eventTypeId,
  date: slot.date,
  startTime: slot.startTime,
  endTime: slot.endTime,
});
      setHoldResult(result);
      setHeldSlot(slot);
    } catch (err) {
      setHoldError(err instanceof Error ? err.message : "Could not hold this slot");
      loadSlots();
    } finally {
      setHolding(false);
    }
  };

  const resetSelection = () => {
    if (holdResult) fireReleaseBeacon(holdResult.holdToken);
    setHoldResult(null);
    setHeldSlot(null);
    setShowDetailsForm(false);
    loadSlots();
  };

  return {
    holdResult,
    heldSlot,
    holdError,
    holding,
    secondsLeft,
    showDetailsForm,
    setShowDetailsForm,
    handleSelectSlot,
    resetSelection,
  };
}