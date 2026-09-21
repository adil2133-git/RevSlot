"use client";

import React from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { ArrowUpRight, Plus } from "lucide-react";
import type { ReviewerProfile } from "../type";
import { useAuthStore } from "@/features/auth/store/authStore";

interface DashboardHeaderProps {
  reviewer?: ReviewerProfile;
  todayCount?: number;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  reviewer,
}) => {
  const user = useAuthStore((state) => state.user);
  const reviewerName = reviewer?.name || user?.name || "Reviewer";
  const publicUsername = reviewer?.username || user?.username;
  const todayFormatted = dayjs().format("dddd, MMM D");

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Welcome Title & Date */}
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Welcome back, {reviewerName}
          </h1>
          <span className="rounded-full bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 text-xs font-semibold text-primary">
            Faculty Reviewer
          </span>
        </div>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Here is your agenda and review schedule for today,{" "}
          <span className="font-bold text-slate-800">{todayFormatted}.</span>
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {publicUsername ? (
          <Link
            href={`/${publicUsername}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-all hover:border-slate-300"
          >
            <span>View Public Link</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}

        <Link
          href="/dashboard/event-types/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary/95 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>New Event Type</span>
        </Link>
      </div>
    </div>
  );
};
