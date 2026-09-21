"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAuthStore } from "@/features/auth/store/authStore";
import NotificationBell from "@/features/notifications/components/NotificationBell";
import { Home, User } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    if (isHydrated && user && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [isHydrated, user, router]);

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

          {/* Single Notification Bell & Profile Avatar */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live Socket-driven Notification Bell */}
            <NotificationBell role="admin" />

            {/* Profile Avatar / Settings Link */}
            <Link
              href="/admin/settings"
              title="Admin Profile & Settings"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white shadow-2xs hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <User className="h-4 w-4" />
            </Link>
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
