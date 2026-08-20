import dayjs, { Dayjs } from "dayjs";

export interface CalendarDay {
  date: Dayjs;
  label: number;
  inCurrentMonth: boolean;
  isPast: boolean;
  isToday: boolean;
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function getWeekdayLabels() {
  return WEEKDAY_LABELS;
}

export function buildMonthGrid(monthAnchor: Dayjs): CalendarDay[][] {
  const startOfMonth = monthAnchor.startOf("month");
  const daysInMonth = monthAnchor.daysInMonth();
  const leadingBlanks = startOfMonth.day(); // 0 = Sunday
  const today = dayjs().startOf("day");

  const cells: CalendarDay[] = [];

  for (let i = leadingBlanks - 1; i >= 0; i--) {
    const date = startOfMonth.subtract(i + 1, "day");
    cells.push({
      date,
      label: date.date(),
      inCurrentMonth: false,
      isPast: date.isBefore(today),
      isToday: date.isSame(today, "day"),
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = startOfMonth.date(d);
    cells.push({
      date,
      label: d,
      inCurrentMonth: true,
      isPast: date.isBefore(today),
      isToday: date.isSame(today, "day"),
    });
  }

  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}