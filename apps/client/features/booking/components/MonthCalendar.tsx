import type { Dispatch, SetStateAction } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { WEEKDAY_LABELS } from "../utils";

type MonthCalendarProps = {
  visibleMonth: Dayjs;
  setVisibleMonth: Dispatch<SetStateAction<Dayjs>>;
  calendarDays: Dayjs[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  availableCountByDate: Record<string, number>;
  bookingWindowDays: number;
};

export default function MonthCalendar({
  visibleMonth,
  setVisibleMonth,
  calendarDays,
  selectedDate,
  setSelectedDate,
  availableCountByDate,
  bookingWindowDays,
}: MonthCalendarProps) {
  const maxBookableDate = dayjs().add(bookingWindowDays, "day");
  const nextMonthDisabled = visibleMonth.format("YYYY-MM") >= maxBookableDate.format("YYYY-MM");
  return (
    <div className="mb-5 rounded-xl border border-slate-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setVisibleMonth((m) => m.subtract(1, "month"))}
          disabled={visibleMonth.isSame(dayjs().startOf("month"), "month")}
          aria-label="Previous month"
          className="rounded-md p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <p className="text-sm font-medium text-on-surface">
          {visibleMonth.format("MMMM YYYY")}
        </p>
        <button
          onClick={() => setVisibleMonth((m) => m.add(1, "month"))}
          disabled={nextMonthDisabled}
          aria-label="Next month"
          className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="py-1 text-xs font-medium text-slate-400">
            {d}
          </div>
        ))}
        {calendarDays.map((day) => {
          const dateStr = day.format("YYYY-MM-DD");
          const inMonth = day.month() === visibleMonth.month();
          const isPast = day.isBefore(dayjs(), "day");
          const isToday = day.isSame(dayjs(), "day");
          const isSelected = dateStr === selectedDate;
          const isBeyondWindow = day.isAfter(maxBookableDate, "day");
          const availableCount = availableCountByDate[dateStr] ?? 0;
          const clickable = inMonth && !isPast;

          return (
            <button
              key={dateStr}
              disabled={!clickable}
              onClick={() => setSelectedDate(dateStr)}
              className={`relative rounded-lg py-2 text-sm ${
                !inMonth
                  ? "text-slate-300"
                  : isPast || isBeyondWindow
                  ? "text-slate-300"
                  : isSelected
                  ? "bg-primary font-medium text-on-primary"
                  : isToday
                  ? "bg-secondary font-medium text-on-surface"
                  : "text-on-surface hover:bg-slate-100"
              } disabled:cursor-default`}
            >
              {day.date()}
              {clickable && (
                <span
                  className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                    isSelected
                      ? "bg-on-primary"
                      : availableCount > 0
                      ? "bg-emerald-500"
                      : "bg-slate-300"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> Unavailable
        </span>
      </div>
    </div>
  );
}