import type { TimeBlock } from "../types";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon -> Sun display order

function formatTime(time: string) {
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${mStr} ${period}`;
}

export interface TimeBlockGroup {
  key: string;
  days: string;
  startTime: string;
  endTime: string;
}

export function groupTimeBlocks(blocks: TimeBlock[]): TimeBlockGroup[] {
  const byKey = new Map<string, Set<number>>();

  for (const block of blocks) {
    const key = `${block.startTime}|${block.endTime}`;
    const days = byKey.get(key) ?? new Set<number>();
    days.add(block.dayOfWeek);
    byKey.set(key, days);
  }

  const groups = Array.from(byKey.entries()).map(([key, daySet]) => {
    const [startTime, endTime] = key.split("|");
    const sortedDays = Array.from(daySet).sort(
      (a, b) => WEEK_ORDER.indexOf(a) - WEEK_ORDER.indexOf(b)
    );
    return {
      key,
      sortRank: WEEK_ORDER.indexOf(sortedDays[0]),
      days: sortedDays.map((d) => DAY_LABELS[d]).join(", "),
      startTime: formatTime(startTime),
      endTime: formatTime(endTime),
    };
  });

  return groups.sort((a, b) => a.sortRank - b.sortRank);
}