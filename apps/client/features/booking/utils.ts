import dayjs from "dayjs";

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