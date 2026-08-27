"use client";

import { useState, useRef, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

interface RangeCalendarProps {
  startDate: string | null;
  endDate: string | null;
  onSelect: (start: string | null, end: string | null) => void;
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

interface MonthGridProps {
  month: Dayjs;
  startDate: string | null;
  endDate: string | null;
  hoverDate: string | null;
  isDragging: boolean;
  dragAnchorDate: string | null;
  today: string;
  onDayMouseDown: (dateStr: string) => void;
  onDayMouseEnter: (dateStr: string) => void;
  onDayClick: (dateStr: string) => void;
  onMouseLeaveGrid: () => void;
}

function MonthGrid({
  month,
  startDate,
  endDate,
  hoverDate,
  isDragging,
  dragAnchorDate,
  today,
  onDayMouseDown,
  onDayMouseEnter,
  onDayClick,
  onMouseLeaveGrid,
}: MonthGridProps) {
  const cells = buildMonthGrid(month);

  return (
    <div onMouseLeave={onMouseLeaveGrid} className="select-none">
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

          let effectiveStart = startDate;
          let effectiveEnd = endDate;

          if (isDragging && dragAnchorDate && hoverDate) {
            effectiveStart = dragAnchorDate < hoverDate ? dragAnchorDate : hoverDate;
            effectiveEnd = dragAnchorDate < hoverDate ? hoverDate : dragAnchorDate;
          } else if (startDate && !endDate && hoverDate) {
            effectiveStart = startDate < hoverDate ? startDate : hoverDate;
            effectiveEnd = startDate < hoverDate ? hoverDate : startDate;
          }

          const isStart = dateStr === effectiveStart;
          const isEnd = dateStr === effectiveEnd;
          const isInRange =
            effectiveStart &&
            effectiveEnd &&
            dateStr > effectiveStart &&
            dateStr < effectiveEnd;
          const isEndpoint = isStart || isEnd;
          const isSingle = isStart && isEnd;

          return (
            <div key={dateStr} className="flex h-11 items-center justify-center">
              <button
                type="button"
                disabled={isPast}
                onMouseDown={() => !isPast && onDayMouseDown(dateStr)}
                onMouseEnter={() => !isPast && onDayMouseEnter(dateStr)}
                onClick={() => !isPast && onDayClick(dateStr)}
                className={[
                  "flex h-9 items-center justify-center text-sm transition select-none",
                  isPast && "w-9 rounded-full cursor-not-allowed text-slate-300",
                  !isPast && !isEndpoint && !isInRange &&
                    "w-9 rounded-full text-on-surface hover:bg-surface-hover",
                  isInRange && "w-full rounded-none bg-secondary text-on-secondary",
                  isStart && !isSingle && "w-full rounded-l-full rounded-r-none bg-primary font-semibold text-on-primary",
                  isEnd && !isSingle && "w-full rounded-r-full rounded-l-none bg-primary font-semibold text-on-primary",
                  isSingle && "w-9 rounded-full bg-primary font-semibold text-on-primary",
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
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragAnchorDate, setDragAnchorDate] = useState<string | null>(null);

  const didDragRef = useRef(false);
  const today = dayjs().format("YYYY-MM-DD");

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragAnchorDate(null);
      }
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isDragging]);

  const handleDayMouseDown = (dateStr: string) => {
    didDragRef.current = false;
    setIsDragging(true);
    setDragAnchorDate(dateStr);
    setHoverDate(dateStr);
  };

  const handleDayMouseEnter = (dateStr: string) => {
    setHoverDate(dateStr);
    if (isDragging && dragAnchorDate && dragAnchorDate !== dateStr) {
      didDragRef.current = true;
      const start = dragAnchorDate < dateStr ? dragAnchorDate : dateStr;
      const end = dragAnchorDate < dateStr ? dateStr : dragAnchorDate;
      onSelect(start, end);
    }
  };

  const handleDayClick = (dateStr: string) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }

    if (!startDate || (startDate && endDate)) {
      onSelect(dateStr, null);
      setHoverDate(dateStr);
    } else {
      const start = dateStr < startDate ? dateStr : startDate;
      const end = dateStr < startDate ? startDate : dateStr;
      onSelect(start, end);
      setHoverDate(null);
    }
  };

  const handleMouseLeaveGrid = () => {
    if (!isDragging) {
      setHoverDate(null);
    }
  };

  const nextMonth = visibleMonth.add(1, "month");

  return (
    <div className="rounded-xl border border-slate-100 p-8 select-none">
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
            hoverDate={hoverDate}
            isDragging={isDragging}
            dragAnchorDate={dragAnchorDate}
            today={today}
            onDayMouseDown={handleDayMouseDown}
            onDayMouseEnter={handleDayMouseEnter}
            onDayClick={handleDayClick}
            onMouseLeaveGrid={handleMouseLeaveGrid}
          />
          <MonthGrid
            month={nextMonth}
            startDate={startDate}
            endDate={endDate}
            hoverDate={hoverDate}
            isDragging={isDragging}
            dragAnchorDate={dragAnchorDate}
            today={today}
            onDayMouseDown={handleDayMouseDown}
            onDayMouseEnter={handleDayMouseEnter}
            onDayClick={handleDayClick}
            onMouseLeaveGrid={handleMouseLeaveGrid}
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