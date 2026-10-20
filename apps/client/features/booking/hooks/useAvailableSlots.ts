"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { fetchAvailableSlots } from "../api/bookingApi";
import type { SlotItem } from "../type";

export function useAvailableSlots(eventTypeId: number | undefined) {
  const [visibleMonth, setVisibleMonth] = useState<Dayjs>(dayjs().startOf("month"));
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const cacheRef = useRef<Map<string, SlotItem[]>>(new Map());

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

  const loadSlots = (force = false) => {
    if (!eventTypeId) return;
    const monthKey = `${eventTypeId}:${visibleMonth.format("YYYY-MM")}`;
    const cached = cacheRef.current.get(monthKey);

    if (cached && !force) {
      setSlots(cached);
    } else {
      setSlotsLoading(true);
    }

    fetchAvailableSlots(
      eventTypeId,
      visibleMonth.startOf("month").format("YYYY-MM-DD"),
      visibleMonth.endOf("month").format("YYYY-MM-DD")
    )
      .then((data) => {
        cacheRef.current.set(monthKey, data);
        setSlots(data);
      })
      .catch(() => {
        if (!cached) setSlots([]);
      })
      .finally(() => setSlotsLoading(false));
  };

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventTypeId, visibleMonth]);

  const availableCountByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of slots) {
      counts[s.date] = (counts[s.date] ?? 0) + 1;
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