"use client";

import React from "react";
import type { DashboardMetrics } from "../type";

interface MetricsCardsProps {
  metrics?: DashboardMetrics;
  timeframe: "today" | "week" | "month";
  onTimeframeChange: (tf: "today" | "week" | "month") => void;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  metrics,
  timeframe,
  onTimeframeChange,
}) => {
  const upcoming = metrics?.upcomingReviews ?? 0;
  const completed = metrics?.completedReviews ?? 0;
  const activeEvents = metrics?.activeEventTypes ?? 0;
  const hoursLogged = metrics?.reviewHoursLogged ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Upcoming Reviews */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-surface-card p-5 shadow-surface transition-all hover:border-slate-300 hover:shadow-raised">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Upcoming Reviews
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-3xl font-extrabold tracking-tight text-on-surface">
            {upcoming}
          </span>
          
          {/* Timeframe pill selector */}
          <div className="inline-flex rounded-full bg-slate-100 p-0.5 text-xs font-medium text-slate-600">
            {(["today", "week", "month"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => onTimeframeChange(tf)}
                className={`rounded-full px-2.5 py-1 transition-colors capitalize ${
                  timeframe === tf
                    ? "bg-primary text-on-primary shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Card 2: Completed Reviews */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-surface-card p-5 shadow-surface transition-all hover:border-slate-300 hover:shadow-raised">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Completed Reviews
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-3xl font-extrabold tracking-tight text-on-surface">
            {completed}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            THIS SEMESTER
          </span>
        </div>
      </div>

      {/* Card 3: Active Event Types */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-surface-card p-5 shadow-surface transition-all hover:border-slate-300 hover:shadow-raised">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active Event Types
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-3xl font-extrabold tracking-tight text-on-surface">
            {activeEvents}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            ALL ACTIVE
          </span>
        </div>
      </div>

      {/* Card 4: Review Hours */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-surface-card p-5 shadow-surface transition-all hover:border-slate-300 hover:shadow-raised">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Review Hours
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-3xl font-extrabold tracking-tight text-on-surface">
            {hoursLogged}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            HOURS LOGGED
          </span>
        </div>
      </div>
    </div>
  );
};
