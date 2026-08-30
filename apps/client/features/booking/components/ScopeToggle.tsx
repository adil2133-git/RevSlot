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
    <div className="flex rounded-lg border border-slate-300">
      {OPTIONS.map((opt, idx) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 text-sm font-semibold transition ${
            idx === 0 ? "rounded-l-lg" : idx === OPTIONS.length - 1 ? "rounded-r-lg" : ""
          } ${
            value === opt.value
              ? "bg-primary text-on-primary"
              : "bg-surface-card text-slate-400 hover:text-on-surface"
          } ${idx !== 0 ? "border-l border-slate-300" : ""}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}