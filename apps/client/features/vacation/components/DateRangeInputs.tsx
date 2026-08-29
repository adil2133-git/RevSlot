"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { CalendarIcon } from "./icons";

interface DateRangeInputsProps {
  startDate: string | null;
  endDate: string | null;
  minDate: string;
  onChange: (start: string | null, end: string | null) => void;
}

export default function DateRangeInputs({
  startDate,
  endDate,
  minDate,
  onChange,
}: DateRangeInputsProps) {
  const [startRaw, setStartRaw] = useState(startDate ?? "");
  const [endRaw, setEndRaw] = useState(endDate ?? "");

  useEffect(() => {
    setStartRaw(startDate ?? "");
  }, [startDate]);

  useEffect(() => {
    setEndRaw(endDate ?? "");
  }, [endDate]);

  const isValidDateStr = (val: string) => {
    return (
      /^\d{4}-\d{2}-\d{2}$/.test(val) &&
      dayjs(val).isValid() &&
      dayjs(val).format("YYYY-MM-DD") === val
    );
  };

  const handleStartChange = (val: string) => {
    setStartRaw(val);
    if (!val.trim()) {
      onChange(null, endDate);
      return;
    }
    if (isValidDateStr(val)) {
      const newStart = val;
      const newEnd = endDate && endDate < newStart ? null : endDate;
      onChange(newStart, newEnd);
    }
  };

  const handleEndChange = (val: string) => {
    setEndRaw(val);
    if (!val.trim()) {
      onChange(startDate, null);
      return;
    }
    if (isValidDateStr(val)) {
      onChange(startDate, val);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label htmlFor="startDate" className="mb-2 block text-sm font-semibold text-on-surface">
          Start Date
        </label>
        <div className="relative flex items-center">
          <CalendarIcon className="pointer-events-none absolute left-3.5 text-slate-400" />
          <input
            id="startDate"
            type="text"
            placeholder="YYYY-MM-DD"
            value={startRaw}
            onChange={(e) => handleStartChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-on-surface placeholder:text-slate-400 focus:border-primary focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label htmlFor="endDate" className="mb-2 block text-sm font-semibold text-on-surface">
          End Date
        </label>
        <div className="relative flex items-center">
          <CalendarIcon className="pointer-events-none absolute left-3.5 text-slate-400" />
          <input
            id="endDate"
            type="text"
            placeholder="YYYY-MM-DD"
            value={endRaw}
            onChange={(e) => handleEndChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-on-surface placeholder:text-slate-400 focus:border-primary focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}