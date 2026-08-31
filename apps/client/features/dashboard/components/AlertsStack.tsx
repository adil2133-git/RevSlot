"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { DashboardAlerts } from "../type";

interface AlertsStackProps {
  alerts: DashboardAlerts;
}

export const AlertsStack: React.FC<AlertsStackProps> = ({ alerts }) => {
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

  const handleDismiss = (key: string) => {
    setDismissed((prev) => ({ ...prev, [key]: true }));
  };

  const hasImminent = alerts.imminentSession && !dismissed["imminent"];
  const hasPending = alerts.pendingEvaluations && !dismissed["pending"];
  const hasVacation = alerts.vacationNotice && !dismissed["vacation"];

  if (!hasImminent && !hasPending && !hasVacation) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Alert 1: Imminent Session */}
      {hasImminent && alerts.imminentSession && (
        <div className="flex items-center justify-between rounded-xl border border-blue-200/80 bg-blue-50/70 px-4 py-3 text-sm text-blue-900 shadow-2xs transition-all">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <span className="font-medium">
              <strong className="font-semibold">Imminent Session:</strong>{" "}
              {alerts.imminentSession.message}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleDismiss("imminent")}
            className="ml-4 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-blue-600 hover:bg-blue-100 hover:text-blue-900"
            aria-label="Dismiss alert"
          >
            ✕
          </button>
        </div>
      )}

      {/* Alert 2: Action Required / Pending Feedback */}
      {hasPending && alerts.pendingEvaluations && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-sm text-amber-900 shadow-2xs transition-all">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <span className="font-medium">
              <strong className="font-semibold">Action Required:</strong>{" "}
              {alerts.pendingEvaluations.message}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/reviews"
              className="rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-amber-950 transition-colors"
            >
              {alerts.pendingEvaluations.actionLabel}
            </Link>
            <button
              type="button"
              onClick={() => handleDismiss("pending")}
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-amber-700 hover:bg-amber-100 hover:text-amber-950"
              aria-label="Dismiss alert"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Alert 3: Vacation active */}
      {hasVacation && alerts.vacationNotice && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-100/80 px-4 py-3 text-sm text-slate-800 shadow-2xs transition-all">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <span className="font-medium">{alerts.vacationNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => handleDismiss("vacation")}
            className="ml-4 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900"
            aria-label="Dismiss alert"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
