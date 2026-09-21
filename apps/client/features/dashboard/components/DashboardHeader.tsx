"use client";

import React from "react";
import Link from "next/link";
import type { ReviewerProfile } from "../type";

interface DashboardHeaderProps {
  reviewer?: ReviewerProfile;
  todayCount?: number;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  reviewer,
  todayCount = 0,
}) => {
  const reviewerName = reviewer?.name || "Reviewer";

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">
          Welcome back, {reviewerName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          You have{" "}
          <span className="font-semibold text-on-surface">
            {todayCount} project review session{todayCount === 1 ? "" : "s"}
          </span>{" "}
          scheduled for today.
        </p>
      </div>

      <div>
        <Link
          href="/dashboard/event-types/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-on-primary shadow-surface transition-shadow hover:shadow-raised"
        >
          <span className="text-base font-normal leading-none">+</span>
          New Event Type
        </Link>
      </div>
    </div>
  );
};
