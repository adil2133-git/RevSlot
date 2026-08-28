import type { EventType } from "../types";

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M3 9h18M8 2v4M16 2v4" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="m9.5 9.5 5 5m0-5-5 5" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.5 4 5.5 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.5-4-9s1.5-6.5 4-9Z" />
  </svg>
);

export default function EventTypeStats({ eventTypes }: { eventTypes: EventType[] }) {
  const total = eventTypes.length;
  const active = eventTypes.filter((et) => et.isActive).length;
  const inactive = total - active;
  const publicCount = eventTypes.filter((et) => et.isPublic).length;

  const stats = [
    { label: "Total Types", sub: "All event types", value: total, icon: <CalendarIcon />, tone: "bg-secondary text-primary" },
    { label: "Active", sub: "Active event types", value: active, icon: <CheckIcon />, tone: "bg-emerald-50 text-emerald-600" },
    { label: "Inactive", sub: "Inactive event types", value: inactive, icon: <XIcon />, tone: "bg-error-container text-error" },
    { label: "Public", sub: "Visible on your public page", value: publicCount, icon: <GlobeIcon />, tone: "bg-violet-50 text-violet-600" },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 rounded-xl border border-slate-100 bg-surface-card p-4 shadow-surface"
        >
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.tone}`}>
            {stat.icon}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold leading-tight text-on-surface">{stat.value}</p>
            <p className="truncate text-xs text-slate-400">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}