"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAdminStore } from "@/features/admin/store/adminStore";

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
  no_show: "bg-red-50 text-red-700",
  rescheduled: "bg-amber-50 text-amber-700",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    ", " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function AdminDashboardPage() {
  const { stats, bookings, isLoading, fetchStats, fetchBookings } = useAdminStore();

  useEffect(() => {
    fetchStats();
    fetchBookings({ limit: 4 });
  }, [fetchStats, fetchBookings]);

  const refresh = () => {
    fetchStats();
    fetchBookings({ limit: 4 });
  };

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-1.5 text-2xl font-semibold tracking-tight text-on-surface">
            Dashboard Overview
          </h1>
          <p className="text-sm text-slate-600">
            Monitor platform performance and scheduling activity.
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-surface-card px-4 py-2 text-sm font-medium text-on-surface shadow-surface hover:bg-surface-hover"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh Data
        </button>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-surface-card p-5 shadow-surface">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Reviewers</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-on-surface">
              {stats ? stats.totalReviewers : "—"}
            </span>
            {stats && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                {stats.activeReviewers} Active
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-surface-card p-5 shadow-surface">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Bookings This Week</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18" /></svg>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-on-surface">
              {stats ? stats.bookingsThisWeek : "—"}
            </span>
            {stats && stats.bookingsWeekChangePct !== null && (
              <span className={`text-xs font-medium ${stats.bookingsWeekChangePct >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                {stats.bookingsWeekChangePct >= 0 ? "+" : ""}
                {stats.bookingsWeekChangePct}% vs last week
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-surface-card p-5 shadow-surface">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">No-Show Rate</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-on-surface">
              {stats ? `${stats.noShowRatePct}%` : "—"}
            </span>
            <span className="text-xs font-medium text-slate-400">Target &lt; 5%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_2fr]">
        {/* Reviewer management promo card */}
        <div className="rounded-xl border border-slate-100 bg-surface-card p-6 shadow-surface">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-on-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
          </div>
          <h3 className="mb-1.5 text-base font-semibold text-on-surface">Reviewer Management</h3>
          <p className="mb-6 text-sm text-slate-600">
            Oversee reviewer accounts, availability, and expertise profiles to ensure optimal scheduling.
          </p>
          <Link
            href="/admin/reviewers"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary shadow-surface hover:opacity-90"
          >
            View All Reviewers
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>
        </div>

        {/* Recent bookings */}
        <div className="rounded-xl border border-slate-100 bg-surface-card p-6 shadow-surface">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-on-surface">Recent Bookings</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-400">
                <th className="pb-2 pr-3 font-medium">Reviewer</th>
                <th className="pb-2 pr-3 font-medium">Advisor/Intern</th>
                <th className="pb-2 pr-3 font-medium">Status</th>
                <th className="pb-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && bookings.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-slate-400">Loading…</td></tr>
              )}
              {!isLoading && bookings.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-slate-400">No bookings yet</td></tr>
              )}
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-primary">
                        {initials(b.reviewerName)}
                      </span>
                      <span className="font-medium text-on-surface">{b.reviewerName}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-slate-600">{b.advisorEmail.split("@")[0]}</td>
                  <td className="py-3 pr-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status ?? "confirmed"]}`}>
                      {(b.status ?? "confirmed").replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600">{formatTime(b.startTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link
            href="/admin/bookings"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            View All Bookings →
          </Link>
        </div>
      </div>
    </div>
  );
}