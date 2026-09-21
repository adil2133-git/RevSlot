"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  Users,
  Calendar,
  CreditCard,
  AlertTriangle,
  MessageSquare,
  FileText,
  BarChart2,
  Settings,
  LogOut,
  ChevronsUpDown,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/store/authStore";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/admin/reviewers", label: "Reviewers", icon: Users },
  { href: "/admin/bookings", label: "Bookings", icon: Calendar },
  { href: "/admin/payouts", label: "Payout Requests", icon: CreditCard },
  { href: "/admin/disputes", label: "Disputes & No-Shows", icon: AlertTriangle },
  { href: "/admin/feedback", label: "Feedback History", icon: MessageSquare },
  { href: "/admin/audit-log", label: "Audit Log", icon: FileText },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  const displayName = user?.name || "Admin Executive";
  const displayHandle = user?.email ? `@${user.email.split("@")[0]} · Admin` : "@superadmin · Admin";

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-100 bg-white">
      {/* 1. Brand Logo */}
      <div className="flex h-16 items-center px-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2 text-lg font-bold tracking-tight text-[#003366]">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#003366] text-xs font-bold text-white">
            R
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight text-slate-900 leading-tight">
              RevSlot
            </div>
            <div className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
              SUPER ADMIN
            </div>
          </div>
        </Link>
      </div>

      {/* 2. Navigation Items */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                active
                  ? "bg-[#002b49] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  active ? "text-white" : "text-slate-400 group-hover:text-slate-700"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 3. User Card & Popover */}
      <div ref={popoverRef} className="relative border-t border-slate-100 p-3">
        {popoverOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email || "superadmin@revslot.internal"}</p>
            </div>
            <div className="py-1 space-y-0.5">
              <Link
                href="/admin/settings"
                onClick={() => setPopoverOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                <span>Settings</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4 text-rose-500" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setPopoverOpen((prev) => !prev)}
          className="flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
            SA
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-900">{displayName}</p>
            <p className="truncate text-[11px] text-slate-500 font-medium">{displayHandle}</p>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        </button>
      </div>
    </aside>
  );
}