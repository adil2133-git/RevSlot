"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";

// Matches the Stitch "Dashboard Overview" design sidebar. Feedback
// History, Audit Log, and Analytics are in the design but have no
// backend yet (outside tasks 7-11) — shown but disabled until those
// modules exist, rather than left out of the nav entirely.
const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", enabled: true, icon: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ) },
  { href: "/admin/reviewers", label: "Reviewers", enabled: true, icon: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ) },
  { href: "/admin/bookings", label: "Bookings", enabled: true, icon: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 2v4M16 2v4" />
    </svg>
  ) },
  { href: "/admin/feedback", label: "Feedback History", enabled: false, icon: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ) },
  { href: "/admin/audit-log", label: "Audit Log", enabled: false, icon: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  ) },
  { href: "/admin/analytics", label: "Analytics", enabled: false, icon: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M18 17V9M13 17V5M8 17v-3" />
    </svg>
  ) },
];

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login/admin");
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-100 bg-surface-card">
      <div className="flex h-16 flex-col justify-center px-6">
        <Link href="/admin/dashboard" className="text-lg font-semibold tracking-tight text-primary">
          RevSlot
        </Link>
        <span className="text-[11px] font-medium text-slate-400">Super Admin</span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);

          if (!item.enabled) {
            return (
              <div
                key={item.href}
                title="Coming soon"
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300"
              >
                <span className="text-slate-300">{item.icon}</span>
                {item.label}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                active
                  ? "bg-primary text-on-primary shadow-surface"
                  : "text-on-surface hover:bg-surface-hover"
              }`}
            >
              <span className={active ? "text-on-primary" : "text-slate-400 group-hover:text-primary"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative border-t border-slate-100 p-3">
        {menuOpen && (
          <button
            onClick={handleLogout}
            className="mb-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-error transition-colors hover:bg-error-container"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log out
          </button>
        )}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-hover"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary">
            {user ? initials(user.name) : "…"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-on-surface">
              {user?.name ?? "Loading…"}
            </p>
            <p className="truncate text-xs capitalize text-slate-400">{user?.role}</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-slate-400">
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>
      </div>
    </aside>
  );
}