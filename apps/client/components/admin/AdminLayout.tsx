"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAuthStore } from "@/features/auth/store/authStore";
import { Search, Home, Bell, User } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isHydrated && user && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [isHydrated, user, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (isHydrated && user && user.role !== "admin") {
    return null;
  }

  // Derive title from pathname
  let pageTitle = "Dashboard Overview";
  if (pathname.includes("/admin/reviewers")) pageTitle = "Reviewers";
  else if (pathname.includes("/admin/bookings")) pageTitle = "Bookings";
  else if (pathname.includes("/admin/payouts")) pageTitle = "Payout Requests";
  else if (pathname.includes("/admin/disputes")) pageTitle = "Disputes & No-Shows";
  else if (pathname.includes("/admin/feedback")) pageTitle = "Feedback History";
  else if (pathname.includes("/admin/audit-log")) pageTitle = "Audit Log";
  else if (pathname.includes("/admin/analytics")) pageTitle = "Analytics";
  else if (pathname.includes("/admin/settings")) pageTitle = "Settings";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/60">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-6 sm:px-8">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link href="/admin/dashboard" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Home className="h-3.5 w-3.5 text-slate-500" />
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-bold">{pageTitle}</span>
          </div>

          {/* Search, Notifications, Avatar */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="relative hidden sm:block w-72 lg:w-80">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-3.5 w-3.5" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search records, reviewers, s..."
                className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 py-1.5 pl-8 pr-12 text-xs text-slate-800 placeholder-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                <kbd className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 shadow-2xs">
                  ⌘ K
                </kbd>
              </div>
            </div>

            {/* Notification Bell with red indicator */}
            <div className="relative">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>
            </div>

            {/* Profile Avatar */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white shadow-2xs">
              <User className="h-4 w-4" />
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
