"use client";

import { useEffect, useState } from "react";
import { getAnalyticsData, downloadAnalyticsCSV } from "@/features/admin/api/adminApi";
import type { AnalyticsOverviewData } from "@/features/admin/types";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await getAnalyticsData();
      setData(res);
    } catch (err: any) {
      console.error("Failed to load analytics:", err);
      setError(err?.response?.data?.message || "Failed to load analytics data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCSV = async () => {
    try {
      setIsExportingCSV(true);
      await downloadAnalyticsCSV();
    } catch (err) {
      console.error("Failed to download CSV:", err);
      alert("Failed to download CSV report. Please try again.");
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-8 animate-pulse">
        <div>
          <div className="h-8 w-64 rounded-md bg-slate-200"></div>
          <div className="mt-2 h-4 w-96 rounded-md bg-slate-200"></div>
        </div>

        {/* 3 KPI cards skeleton */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
              <div className="flex justify-between">
                <div className="h-4 w-28 rounded bg-slate-200"></div>
                <div className="h-8 w-8 rounded-lg bg-slate-200"></div>
              </div>
              <div className="mt-4 h-8 w-24 rounded bg-slate-200"></div>
            </div>
          ))}
        </div>

        {/* Middle row skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
              <div className="h-5 w-44 rounded bg-slate-200 mb-6"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-4 w-full rounded bg-slate-100"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-red-100 bg-white p-8 text-center shadow-xs">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Unable to load analytics</h2>
        <p className="mt-1 max-w-sm text-sm text-slate-500">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 rounded-lg bg-[#003366] px-4 py-2 text-sm font-medium text-white hover:bg-[#002b55]"
        >
          Try Again
        </button>
      </div>
    );
  }

  const kpis = data?.kpis;
  const bookingsPerReviewer = data?.bookingsPerReviewer || [];
  const noShowRatePerReviewer = data?.noShowRatePerReviewer || [];
  const popularTechStacks = data?.popularTechStacks || [];

  return (
    <div className="space-y-7 pb-12 print:space-y-4 print:p-0">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Analytics Overview
          </h1>
          <p className="text-sm text-slate-500">
            Monitor platform performance and engagement metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* KPI 1: Weekly Bookings */}
        <div className="relative rounded-2xl border border-slate-100 bg-white p-6 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              WEEKLY BOOKINGS
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-700">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-4xl font-extrabold tracking-tight text-slate-900">
              {kpis?.weeklyBookings.current ?? 0}
            </span>
            {kpis && (
              <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                kpis.weeklyBookings.changePct >= 0 ? "text-emerald-600" : "text-red-600"
              }`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  {kpis.weeklyBookings.changePct >= 0 ? (
                    <>
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </>
                  ) : (
                    <>
                      <line x1="7" y1="7" x2="17" y2="17" />
                      <polyline points="17 7 17 17 7 17" />
                    </>
                  )}
                </svg>
                {kpis.weeklyBookings.changePct > 0 ? `+${kpis.weeklyBookings.changePct}%` : `${kpis.weeklyBookings.changePct}%`}
              </span>
            )}
          </div>
        </div>

        {/* KPI 2: Overall No-Show Rate */}
        <div className="relative rounded-2xl border border-slate-100 bg-white p-6 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              OVERALL NO-SHOW RATE
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-700">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <line x1="9" y1="14" x2="15" y2="18" />
                <line x1="15" y1="14" x2="9" y2="18" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-4xl font-extrabold tracking-tight text-slate-900">
              {kpis ? `${kpis.noShowRate.currentPct}%` : "0%"}
            </span>
            {kpis && (
              <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                kpis.noShowRate.changePct <= 0 ? "text-emerald-600" : "text-amber-600"
              }`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  {kpis.noShowRate.changePct <= 0 ? (
                    <>
                      <line x1="7" y1="7" x2="17" y2="17" />
                      <polyline points="17 7 17 17 7 17" />
                    </>
                  ) : (
                    <>
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17" />
                    </>
                  )}
                </svg>
                {kpis.noShowRate.changePct > 0 ? `+${kpis.noShowRate.changePct}%` : `${kpis.noShowRate.changePct}%`}
              </span>
            )}
          </div>
        </div>

        {/* KPI 3: Avg Feedback Turnaround */}
        <div className="relative rounded-2xl border border-slate-100 bg-white p-6 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              AVG. FEEDBACK TURNAROUND
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-700">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-4xl font-extrabold tracking-tight text-slate-900">
              {kpis ? `${kpis.avgFeedbackTurnaround.currentHours} hrs` : "0 hrs"}
            </span>
            {kpis && (
              <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                kpis.avgFeedbackTurnaround.changeHours <= 0 ? "text-emerald-600" : "text-amber-600"
              }`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  {kpis.avgFeedbackTurnaround.changeHours <= 0 ? (
                    <>
                      <line x1="7" y1="7" x2="17" y2="17" />
                      <polyline points="17 7 17 17 7 17" />
                    </>
                  ) : (
                    <>
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17" />
                    </>
                  )}
                </svg>
                {kpis.avgFeedbackTurnaround.changeHours > 0
                  ? `+${kpis.avgFeedbackTurnaround.changeHours} hrs`
                  : `${kpis.avgFeedbackTurnaround.changeHours} hrs`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Middle Row (2 Cards) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Card: Bookings per Reviewer */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 mb-6">
            Bookings per Reviewer
          </h2>

          <div className="space-y-4">
            {bookingsPerReviewer.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-400">
                No reviewer bookings recorded yet.
              </p>
            )}
            {bookingsPerReviewer.map((item) => (
              <div key={item.reviewerId} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{item.name}</span>
                  <span className="font-medium text-slate-500">{item.count}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#002b55] transition-all duration-500"
                    style={{ width: `${Math.max(item.pct, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: No-Show Rate per Reviewer */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 mb-6">
            No-Show Rate per Reviewer
          </h2>

          <div className="space-y-4">
            {noShowRatePerReviewer.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-400">
                No reviewer attendance records yet.
              </p>
            )}
            {noShowRatePerReviewer.map((item) => {
              // Color logic matching visual design
              let barColor = "bg-emerald-500";
              if (item.ratePct > 6.0) {
                barColor = "bg-[#a31616]";
              } else if (item.ratePct >= 3.0) {
                barColor = "bg-amber-500";
              }

              // Compute width for visual clarity (scaled against 10% benchmark)
              const visualWidth = Math.min(100, Math.max(item.ratePct > 0 ? 12 : 0, (item.ratePct / 10) * 100));

              return (
                <div key={item.reviewerId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="font-medium text-slate-500">{item.ratePct}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${barColor} transition-all duration-500`}
                      style={{ width: `${visualWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row (2 Cards) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Card: Most Popular Tech Stacks */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Most Popular Tech Stacks
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Based on booking topics.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3.5">
            {popularTechStacks.map((stack) => (
              <div
                key={stack.name}
                className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: stack.color }}
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    {stack.name}
                  </span>
                </div>
                <div className="mt-2 text-2xl font-extrabold text-slate-900">
                  {stack.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: Export Reports */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-xs">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf1f9] text-[#003366]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>

          <h2 className="text-lg font-bold text-slate-900">
            Export Reports
          </h2>
          <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
            Download comprehensive raw data and formatted summaries for external reporting or offline review.
          </p>

          <div className="mt-6 flex w-full max-w-md items-center justify-center gap-3">
            <button
              onClick={handleExportCSV}
              disabled={isExportingCSV}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs font-bold text-slate-800 shadow-xs transition hover:bg-slate-100 disabled:opacity-50"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
              </svg>
              {isExportingCSV ? "Exporting..." : "Export as CSV"}
            </button>

            <button
              onClick={handleExportPDF}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#002b55] px-4 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-[#001f3f]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
    </div>
  );
}
