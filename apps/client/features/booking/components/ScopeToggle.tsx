type Scope = "upcoming" | "past" | "all";

interface ScopeToggleProps {
  value: Scope;
  onChange: (value: Scope) => void;
}

const OPTIONS: { value: Scope; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "all", label: "All" },
];

export default function ScopeToggle({ value, onChange }: ScopeToggleProps) {
  return (
    <div className="inline-flex items-center rounded-lg bg-slate-100/90 p-1 border border-slate-200/50">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
            value === opt.value
              ? "bg-surface-card text-on-surface shadow-xs"
              : "text-slate-500 hover:text-on-surface"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}