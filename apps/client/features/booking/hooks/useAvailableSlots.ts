"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { fetchAvailableSlots } from "../api/bookingApi";
import type { SlotItem } from "../type";

export function useAvailableSlots(eventTypeId: number | undefined) {
  const [visibleMonth, setVisibleMonth] = useState<Dayjs>(dayjs().startOf("month"));
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Sun-Sat grid covering the full visible month (leading/trailing days
  // from adjacent months included so the grid is always complete weeks)
  const calendarDays = useMemo(() => {
    const start = visibleMonth.startOf("month").startOf("week");
    const end = visibleMonth.endOf("month").endOf("week");
    const days: Dayjs[] = [];
    let cur = start;
    while (cur.isBefore(end) || cur.isSame(end, "day")) {
      days.push(cur);
      cur = cur.add(1, "day");
    }
    return days;
  }, [visibleMonth]);

  const loadSlots = () => {
    if (!eventTypeId) return;
    setSlotsLoading(true);
    fetchAvailableSlots(
      eventTypeId,
      visibleMonth.startOf("month").format("YYYY-MM-DD"),
      visibleMonth.endOf("month").format("YYYY-MM-DD")
    )
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  };

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventTypeId, visibleMonth]);

  const availableCountByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of slots) {
      if (s.status !== "available") continue;
      counts[s.slotDate] = (counts[s.slotDate] ?? 0) + 1;
    }
    return counts;
  }, [slots]);

  return {
    visibleMonth,
    setVisibleMonth,
    slots,
    slotsLoading,
    calendarDays,
    availableCountByDate,
    loadSlots,
  };
}