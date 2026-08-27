"use client";

import { useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

interface RangeCalendarProps {
  startDate: string | null;
  endDate: string | null;
  onSelect: (start: string, end: string) => void;
}

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function buildMonthGrid(month: Dayjs) {
  const startOfMonth = month.startOf("month");
  const daysInMonth = month.daysInMonth();
  const startWeekday = startOfMonth.day();

  const cells: (number | null)[] = Array(startWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return cells;
}

function MonthGrid({
  month,
  startDate,
  endDate,
  onPick,
  today,
}: {
  month: Dayjs;
  startDate: string | null;
  endDate: string | null;
  onPick: (dateStr: string) => void;
  today: string;
}) {
  const cells = buildMonthGrid(month);

  return (
    <div>
      <p className="mb-4 text-center text-base font-semibold text-on-surface">
        {month.format("MMMM YYYY")}
      </p>
      <div className="grid grid-cols-7 gap-y-1">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="pb-2 text-center text-xs font-semibold text-slate-400">
            {label}
          </div>
        ))}
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="h-11" />;

          const dateStr = month.date(day).format("YYYY-MM-DD");
          const isPast = dateStr < today;
          const isStart = dateStr === startDate;
          const isEnd = dateStr === endDate;
          const isInRange =
            startDate && endDate && dateStr > startDate && dateStr < endDate;
          const isEndpoint = isStart || isEnd;

          return (
            <div key={dateStr} className="flex h-11 items-center justify-center">
              <button
                type="button"
                disabled={isPast}
                onClick={() => onPick(dateStr)}
                className={[
                  "flex h-9 w-9 items-center justify-center text-sm transition",
                  isPast && "cursor-not-allowed text-slate-300",
                  !isPast && !isEndpoint && !isInRange &&
                    "rounded-full text-on-surface hover:bg-surface-hover",
                  isInRange && "w-full rounded-none bg-secondary text-on-secondary",
                  isStart && endDate && !isEnd && "rounded-l-full rounded-r-none bg-primary font-semibold text-on-primary",
                  isEnd && startDate && !isStart && "rounded-r-full rounded-l-none bg-primary font-semibold text-on-primary",
                  isStart && isEnd && "rounded-full bg-primary font-semibold text-on-primary",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {day}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RangeCalendar({ startDate, endDate, onSelect }: RangeCalendarProps) {
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startDate ? dayjs(startDate).startOf("month") : dayjs().startOf("month")
  );
  const today = dayjs().format("YYYY-MM-DD");

  const handlePick = (dateStr: string) => {
    if (!startDate || (startDate && endDate)) {
      onSelect(dateStr, dateStr);
      return;
    }

    if (dateStr < startDate) {
      onSelect(dateStr, startDate);
    } else {
      onSelect(startDate, dateStr);
    }
  };

  const nextMonth = visibleMonth.add(1, "month");

  return (
    <div className="rounded-xl border border-slate-100 p-8">
      <div className="flex items-start gap-8">
        <button
          type="button"
          onClick={() => setVisibleMonth((m) => m.subtract(1, "month"))}
          className="mt-1 rounded-full p-2 text-slate-400 hover:bg-surface-hover hover:text-on-surface"
          aria-label="Previous month"
        >
          <ChevronLeftIcon />
        </button>

        <div className="grid flex-1 grid-cols-2 gap-12">
          <MonthGrid
            month={visibleMonth}
            startDate={startDate}
            endDate={endDate}
            onPick={handlePick}
            today={today}
          />
          <MonthGrid
            month={nextMonth}
            startDate={startDate}
            endDate={endDate}
            onPick={handlePick}
            today={today}
          />
        </div>

        <button
          type="button"
          onClick={() => setVisibleMonth((m) => m.add(1, "month"))}
          className="mt-1 rounded-full p-2 text-slate-400 hover:bg-surface-hover hover:text-on-surface"
          aria-label="Next month"
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
}