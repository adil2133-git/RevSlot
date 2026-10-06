import dayjs from "@/lib/dayjs";
import type { SlotItem } from "./type";

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatSlotTime(time: string, use12Hour: boolean) {
  const t = dayjs(`2000-01-01T${time}`);
  return use12Hour ? t.format("h:mm A") : t.format("HH:mm");
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function convertSlotsToTimezone(
  slots: SlotItem[],
  reviewerTz: string,
  clientTz: string
): SlotItem[] {
  if (!reviewerTz || !clientTz || reviewerTz === clientTz) {
    return slots.map((s) => ({ ...s, originalSlot: s }));
  }

  return slots.map((s) => {
    const startObj = dayjs.tz(`${s.date} ${s.startTime}`, reviewerTz).tz(clientTz);
    const endObj = dayjs.tz(`${s.date} ${s.endTime}`, reviewerTz).tz(clientTz);

    return {
      eventTypeId: s.eventTypeId,
      date: startObj.format("YYYY-MM-DD"),
      startTime: startObj.format("HH:mm:ss"),
      endTime: endObj.format("HH:mm:ss"),
      originalSlot: s,
    };
  });
}