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
    <div className="flex gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            value === opt.value
              ? "bg-primary text-on-primary"
              : "bg-surface-hover text-slate-400 hover:text-on-surface"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}