"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "@/features/admin/store/adminStore";
import type { AnalyticsRange } from "@/features/admin/types";

// Helper color resolver for no-show rates
function getNoShowColor(rate: number): { bar: string; text: string } {
  if (rate <= 2.5) return { bar: "bg-emerald-500", text: "text-emerald-700" };
  if (rate <= 4.0) return { bar: "bg-teal-500", text: "text-teal-700" };
  if (rate <= 5.5) return { bar: "bg-amber-500", text: "text-amber-700" };
  if (rate <= 7.5) return { bar: "bg-orange-500", text: "text-orange-700" };
  return { bar: "bg-red-600", text: "text-red-700" };
}

// Tech Stack color bullets
const STACK_DOT_COLORS: Record<string, string> = {
  React: "bg-blue-600",
  Python: "bg-sky-500",
  "Node.js": "bg-emerald-500",
  JavaScript: "bg-amber-500",
  Java: "bg-orange-600",
  "System Design": "bg-indigo-600",
  Architecture: "bg-purple-600",
  Database: "bg-cyan-600",
  Other: "bg-slate-400",
};

export default function AdminAnalyticsPage() {
  const { analytics, isAnalyticsLoading, fetchAnalytics, downloadAnalyticsCsv } = useAdminStore();
  const [range, setRange] = useState<AnalyticsRange>("7d");
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  useEffect(() => {
    fetchAnalytics({ range });
  }, [range, fetchAnalytics]);

  const handleRefresh = () => {
    fetchAnalytics({ range });
  };

  const handleCsvExport = async () => {
    try {
      setIsExportingCsv(true);
      await downloadAnalyticsCsv({ range });
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const kpis = analytics?.kpis;
  const bookingsPerReviewer = analytics?.bookingsPerReviewer ?? [];
  const noShowRatePerReviewer = analytics?.noShowRatePerReviewer ?? [];
  const techStacks = analytics?.popularTechStacks ?? [];

  return (
    <div className="space-y-6 print:p-0">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
            Analytics Overview
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor real platform performance and engagement metrics.
          </p>
        </div>

        {/* Timeframe Controls & Refresh */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as AnalyticsRange)}
              className="appearance-none rounded-xl border border-slate-200 bg-surface-card py-2 pl-3.5 pr-9 text-sm font-medium text-on-surface shadow-surface transition-colors hover:border-slate-300 focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="this_month">This Month</option>
              <option value="all">All Time</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isAnalyticsLoading}
            title="Refresh analytics data"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-surface-card px-3.5 py-2 text-sm font-medium text-on-surface shadow-surface transition-colors hover:bg-surface-hover active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isAnalyticsLoading ? "animate-spin text-primary" : "text-slate-500"}
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Top Row: 3 KPI Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* KPI 1: PERIOD BOOKINGS */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-100/80 bg-surface-card p-6 shadow-surface transition-all duration-300 hover:shadow-raised">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                {range === "7d" ? "Weekly Bookings" : "Period Bookings"}
              </span>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-4xl font-extrabold tracking-tight text-on-surface">
                  {isAnalyticsLoading ? "—" : kpis?.weeklyBookings ?? 0}
                </span>
                {!isAnalyticsLoading && kpis?.bookingsChangePct !== null && kpis?.bookingsChangePct !== undefined && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                      kpis.bookingsChangePct >= 0
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      {kpis.bookingsChangePct >= 0 ? (
                        <path d="m7 17 10-10M7 7h10v10" />
                      ) : (
                        <path d="m7 7 10 10M17 7v10H7" />
                      )}
                    </svg>
                    {kpis.bookingsChangePct >= 0 ? `+${kpis.bookingsChangePct}%` : `${kpis.bookingsChangePct}%`}
                  </span>
                )}
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-[#eef4f9] text-[#003366] transition-transform duration-300 group-hover:scale-105">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
          </div>
        </div>

        {/* KPI 2: OVERALL NO-SHOW RATE */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-100/80 bg-surface-card p-6 shadow-surface transition-all duration-300 hover:shadow-raised">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Overall No-Show Rate
              </span>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-4xl font-extrabold tracking-tight text-on-surface">
                  {isAnalyticsLoading ? "—" : `${kpis?.overallNoShowRatePct ?? 0}%`}
                </span>
                {!isAnalyticsLoading && kpis?.noShowRateDeltaPct !== null && kpis?.noShowRateDeltaPct !== undefined && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                      kpis.noShowRateDeltaPct <= 0
                        ? "bg-teal-50 text-teal-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      {kpis.noShowRateDeltaPct <= 0 ? (
                        <path d="m7 7 10 10M17 7v10H7" />
                      ) : (
                        <path d="m7 17 10-10M7 7h10v10" />
                      )}
                    </svg>
                    {kpis.noShowRateDeltaPct <= 0
                      ? `${kpis.noShowRateDeltaPct}%`
                      : `+${kpis.noShowRateDeltaPct}%`}
                  </span>
                )}
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-[#eef4f9] text-[#003366] transition-transform duration-300 group-hover:scale-105">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
                <path d="m10 14 4 4M14 14l-4 4" />
              </svg>
            </div>
          </div>
        </div>

        {/* KPI 3: AVG. FEEDBACK TURNAROUND */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-100/80 bg-surface-card p-6 shadow-surface transition-all duration-300 hover:shadow-raised">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Avg. Feedback Turnaround
              </span>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-4xl font-extrabold tracking-tight text-on-surface">
                  {isAnalyticsLoading
                    ? "—"
                    : kpis && kpis.avgFeedbackTurnaroundHours > 0
                    ? `${kpis.avgFeedbackTurnaroundHours} hrs`
                    : "0 hrs"}
                </span>
                {!isAnalyticsLoading && kpis?.turnaroundDeltaHours !== null && kpis?.turnaroundDeltaHours !== undefined && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                      kpis.turnaroundDeltaHours <= 0
                        ? "bg-teal-50 text-teal-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      {kpis.turnaroundDeltaHours <= 0 ? (
                        <path d="m7 7 10 10M17 7v10H7" />
                      ) : (
                        <path d="m7 17 10-10M7 7h10v10" />
                      )}
                    </svg>
                    {kpis.turnaroundDeltaHours <= 0
                      ? `${kpis.turnaroundDeltaHours} hrs`
                      : `+${kpis.turnaroundDeltaHours} hrs`}
                  </span>
                )}
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-[#eef4f9] text-[#003366] transition-transform duration-300 group-hover:scale-105">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Reviewer Performance Charts (2 Columns) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bookings per Reviewer */}
        <div className="rounded-2xl border border-slate-100/80 bg-surface-card p-6 shadow-surface">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-on-surface">Bookings per Reviewer</h3>
            <span className="text-xs font-medium text-slate-400">Total volume</span>
          </div>

          <div className="space-y-5">
            {isAnalyticsLoading ? (
              <div className="py-12 text-center text-sm text-slate-400">Loading reviewer volume...</div>
            ) : bookingsPerReviewer.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                No reviewer booking records in this timeframe.
              </div>
            ) : (
              bookingsPerReviewer.map((reviewer) => {
                const max = Math.max(...bookingsPerReviewer.map((r) => r.bookingCount), 1);
                const pct = Math.max(8, Math.round((reviewer.bookingCount / max) * 100));

                return (
                  <div key={reviewer.reviewerId} className="group">
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-800 group-hover:text-primary transition-colors">
                        {reviewer.reviewerName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">{reviewer.bookingCount}</span>
                        {reviewer.completedCount > 0 && (
                          <span className="hidden text-xs text-slate-400 sm:inline">
                            ({reviewer.completedCount} done)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#003366] transition-all duration-700 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* No-Show Rate per Reviewer */}
        <div className="rounded-2xl border border-slate-100/80 bg-surface-card p-6 shadow-surface">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-on-surface">No-Show Rate per Reviewer</h3>
            <span className="text-xs font-medium text-slate-400">By rate %</span>
          </div>

          <div className="space-y-5">
            {isAnalyticsLoading ? (
              <div className="py-12 text-center text-sm text-slate-400">Loading no-show data...</div>
            ) : noShowRatePerReviewer.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                No reviewer no-show records in this timeframe.
              </div>
            ) : (
              noShowRatePerReviewer.map((reviewer) => {
                const colors = getNoShowColor(reviewer.noShowRatePct);
                const barWidth = Math.min(100, Math.max(10, reviewer.noShowRatePct * 10));

                return (
                  <div key={reviewer.reviewerId} className="group">
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-800 group-hover:text-primary transition-colors">
                        {reviewer.reviewerName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${colors.text}`}>
                          {reviewer.noShowRatePct}%
                        </span>
                        {reviewer.noShowCount > 0 && (
                          <span className="hidden text-xs text-slate-400 sm:inline">
                            ({reviewer.noShowCount} missed)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${colors.bar} transition-all duration-700 ease-out`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: 2 Cards (Topics & Tech Stacks & Export Reports) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Most Popular Tech Stacks / Topics */}
        <div className="rounded-2xl border border-slate-100/80 bg-surface-card p-6 shadow-surface">
          <div className="mb-1">
            <h3 className="text-lg font-bold text-on-surface">Most Popular Topics & Tech Stacks</h3>
            <p className="text-xs text-slate-400">Based on booking titles and project review stages.</p>
          </div>

          <div className="mt-5">
            {isAnalyticsLoading ? (
              <div className="py-10 text-center text-sm text-slate-400">Loading topics...</div>
            ) : techStacks.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">
                No topic or tech stack distribution data recorded yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3.5">
                {techStacks.map((stack) => (
                  <div
                    key={stack.name}
                    className="group rounded-xl border border-slate-100 bg-[#f8fafc] p-4 transition-all duration-200 hover:border-slate-200 hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          STACK_DOT_COLORS[stack.name] || "bg-primary"
                        }`}
                      />
                      <span className="text-sm font-semibold text-slate-700 truncate">{stack.name}</span>
                    </div>
                    <div className="mt-2 text-3xl font-extrabold text-on-surface">
                      {stack.percentage}%
                    </div>
                    {stack.count > 0 && (
                      <p className="mt-0.5 text-xs text-slate-400">{stack.count} sessions</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Export Reports */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-100/80 bg-surface-card p-6 shadow-surface">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-[#eef4f9] text-[#003366] shadow-sm">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-on-surface">Export Reports</h3>
            <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
              Download comprehensive real platform data and formatted summaries for external reporting or offline review.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={handleCsvExport}
              disabled={isExportingCsv}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M3 15h18M9 3v18" />
              </svg>
              {isExportingCsv ? "Exporting..." : "Export as CSV"}
            </button>

            <button
              onClick={() => setShowPdfModal(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#003366] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#002244] active:scale-95 cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Export as PDF
            </button>
          </div>
        </div>
      </div>

      {/* PDF Printable Modal / View */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
            {/* Modal Controls (Hidden in Print) */}
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 print:hidden">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Executive Report Preview</h2>
                <p className="text-xs text-slate-500">Ready to save as PDF or print</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintPdf}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 cursor-pointer"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setShowPdfModal(false)}
                  className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="space-y-6 text-slate-800">
              <div className="flex items-start justify-between border-b border-slate-200 pb-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-primary">RevSlot</h1>
                  <p className="text-xs font-semibold text-slate-500 uppercase">SUPER ADMIN EXECUTIVE ANALYTICS</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p className="font-semibold text-slate-700">Date: {new Date().toLocaleDateString()}</p>
                  <p>Timeframe: {range.toUpperCase()}</p>
                </div>
              </div>

              {/* KPI Summary Table */}
              <div>
                <h4 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                  Key Metrics Summary
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <span className="text-xs text-slate-500">Period Bookings</span>
                    <p className="text-xl font-bold text-slate-900">{kpis?.weeklyBookings ?? 0}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <span className="text-xs text-slate-500">Overall No-Show Rate</span>
                    <p className="text-xl font-bold text-slate-900">{kpis?.overallNoShowRatePct ?? 0}%</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <span className="text-xs text-slate-500">Avg Feedback Turnaround</span>
                    <p className="text-xl font-bold text-slate-900">
                      {kpis?.avgFeedbackTurnaroundHours ? `${kpis.avgFeedbackTurnaroundHours} hrs` : "0 hrs"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reviewer Performance Table */}
              <div>
                <h4 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                  Reviewer Performance
                </h4>
                {bookingsPerReviewer.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">No reviewer records found in this timeframe.</p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100 text-slate-600">
                        <th className="p-2 font-semibold">Reviewer</th>
                        <th className="p-2 font-semibold">Email</th>
                        <th className="p-2 text-right font-semibold">Bookings</th>
                        <th className="p-2 text-right font-semibold">Completed</th>
                        <th className="p-2 text-right font-semibold">No-Shows</th>
                        <th className="p-2 text-right font-semibold">No-Show %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingsPerReviewer.map((r) => {
                        const noShowStat = noShowRatePerReviewer.find((ns) => ns.reviewerId === r.reviewerId);
                        const rate = noShowStat ? `${noShowStat.noShowRatePct}%` : "0%";
                        return (
                          <tr key={r.reviewerId} className="border-b border-slate-100">
                            <td className="p-2 font-medium">{r.reviewerName}</td>
                            <td className="p-2 text-slate-500">{r.email}</td>
                            <td className="p-2 text-right font-semibold">{r.bookingCount}</td>
                            <td className="p-2 text-right text-slate-600">{r.completedCount}</td>
                            <td className="p-2 text-right text-slate-600">{r.noShowCount}</td>
                            <td className="p-2 text-right font-semibold">{rate}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Topics Breakdown */}
              <div>
                <h4 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                  Topic & Tech Stack Distribution
                </h4>
                {techStacks.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">No topic distribution data recorded.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {techStacks.map((s) => (
                      <div key={s.name} className="rounded-lg border border-slate-200 p-2 text-center">
                        <span className="font-semibold text-slate-700">{s.name}</span>
                        <p className="mt-1 text-base font-bold text-primary">{s.percentage}%</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
