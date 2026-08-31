type StatusFilter = "all" | "confirmed" | "completed";

interface StatusFilterChipsProps {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
}

const OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
];

export default function StatusFilterChips({ value, onChange }: StatusFilterChipsProps) {
  return (
    <div className="flex items-center gap-1.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
            value === opt.value
              ? "bg-primary text-on-primary shadow-xs"
              : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-on-surface"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}