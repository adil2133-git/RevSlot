"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    enabled: true,
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/admin/reviewers",
    label: "Reviewers",
    enabled: true,
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/admin/bookings",
    label: "Bookings",
    enabled: true,
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M3 9h18" />
        <path d="M8 2v4M16 2v4" />
      </svg>
    ),
  },
  {
    href: "/admin/feedback",
    label: "Feedback History",
    enabled: true,
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M8 10h8" />
        <path d="M8 14h4" />
      </svg>
    ),
  },
  {
    href: "/admin/audit-log",
    label: "Audit Log",
    enabled: true,
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    enabled: true,
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3v18h18" />
        <path d="M18 17V9M13 17V5M8 17v-3" />
      </svg>
    ),
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-100 bg-white">
      {/* Brand Header */}
      <div className="flex h-20 items-center gap-3 px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#001f3f] text-base font-black text-white shadow-xs">
          R
        </div>
        <div className="flex flex-col">
          <Link href="/admin/dashboard" className="text-lg font-bold tracking-tight text-slate-900 leading-none">
            RevSlot
          </Link>
          <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">
            SUPER ADMIN
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3.5 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all ${
                active
                  ? "bg-[#dce7f9] text-[#0a1e3b] shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className={active ? "text-[#0a1e3b]" : "text-slate-500 group-hover:text-slate-700"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Academic Session Footer Badge */}
      <div className="p-4">
        <div className="flex items-center justify-between rounded-2xl border border-blue-50/60 bg-[#f0f4f9] p-3.5 shadow-xs">
          <div>
            <p className="text-[11px] font-medium text-slate-500">Academic Session</p>
            <p className="text-xs font-bold text-slate-900">2024-2025 Tier I</p>
          </div>
          <div className="flex h-6 w-6 items-center justify-center text-slate-400">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
        </div>
      </div>
    </aside>
  );
}