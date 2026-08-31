"use client";

import React from "react";
import Link from "next/link";
import type { AvailabilityOverview } from "../type";

interface AvailabilityWidgetProps {
  availability?: AvailabilityOverview;
}

export const AvailabilityWidget: React.FC<AvailabilityWidgetProps> = ({
  availability,
}) => {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-surface-card p-6 shadow-surface">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-on-surface">Availability Overview</h3>
          <Link
            href="/availability"
            className="text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Edit Availability"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </Link>
        </div>

        {/* Rows */}
        <div className="flex flex-col border-t border-b border-slate-100 py-2">
          <div className="flex items-center justify-between py-2 text-xs">
            <span className="font-semibold text-slate-500">Mon - Fri</span>
            <span className="font-bold text-on-surface">09:00 AM - 05:00 PM</span>
          </div>
          <div className="flex items-center justify-between py-2 text-xs">
            <span className="font-semibold text-slate-500">Sat - Sun</span>
            <span className="font-semibold text-slate-400">Unavailable</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 flex items-center gap-3">
        <Link
          href="/dashboard/vacation"
          className="flex-1 rounded-xl border border-slate-200/80 bg-surface-card py-2.5 text-center text-xs font-semibold text-on-surface shadow-2xs transition-colors hover:bg-slate-50"
        >
          Set Vacation
        </Link>
        <Link
          href="/dashboard/question-banks"
          className="flex-1 rounded-xl border border-slate-200/80 bg-surface-card py-2.5 text-center text-xs font-semibold text-on-surface shadow-2xs transition-colors hover:bg-slate-50"
        >
          Topics
        </Link>
      </div>
    </div>
  );
};
