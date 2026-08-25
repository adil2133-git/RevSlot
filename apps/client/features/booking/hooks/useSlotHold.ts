"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { holdSlot } from "../api/bookingApi";
import type { HoldResult, SlotItem } from "../type";

export function useSlotHold(loadSlots: () => void) {
  const [holdResult, setHoldResult] = useState<HoldResult | null>(null);
  const [heldSlot, setHeldSlot] = useState<SlotItem | null>(null);
  const [holdError, setHoldError] = useState<string | null>(null);
  const [holding, setHolding] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [showDetailsForm, setShowDetailsForm] = useState(false);

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