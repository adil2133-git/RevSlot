"use client";

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
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label htmlFor="startDate" className="mb-2 block text-sm font-semibold text-on-surface">
          Start Date
        </label>
        <input
          id="startDate"
          type="date"
          min={minDate}
          value={startDate ?? ""}
          onChange={(e) => {
            const newStart = e.target.value || null;
            // If end date exists and is now before the new start, clear it
            const newEnd = endDate && newStart && endDate < newStart ? null : endDate;
            onChange(newStart, newEnd);
          }}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-on-surface focus:border-primary focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="endDate" className="mb-2 block text-sm font-semibold text-on-surface">
          End Date
        </label>
        <input
          id="endDate"
          type="date"
          min={startDate ?? minDate}
          value={endDate ?? ""}
          onChange={(e) => onChange(startDate, e.target.value || null)}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-on-surface focus:border-primary focus:outline-none"
        />
      </div>
    </div>
  );
}