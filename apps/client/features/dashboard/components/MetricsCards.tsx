"use client";

import React from "react";
import { Calendar, CheckCircle, Layers, Clock } from "lucide-react";
import type { DashboardMetrics } from "../type";

interface MetricsCardsProps {
  metrics?: DashboardMetrics;
  timeframe: "today" | "week" | "month";
  onTimeframeChange: (tf: "today" | "week" | "month") => void;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  metrics,
}) => {
  const upcoming = metrics?.upcomingReviews ?? 0;
  const completed = metrics?.completedReviews ?? 0;
  const activeEvents = metrics?.activeEventTypes ?? 0;
  const hoursLogged = metrics?.reviewHoursLogged ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {/* Card 1: Upcoming Reviews */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-600">
            Upcoming Reviews
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-primary">
            <Calendar className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900">
            {upcoming}
          </span>
          <span className="text-xs font-medium text-slate-400">
            {upcoming === 0 ? "No sessions today" : `${upcoming} scheduled`}
          </span>
        </div>
      </div>

      {/* Card 2: Completed Reviews */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-600">
            Completed Reviews
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-primary">
            <CheckCircle className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900">
            {completed}
          </span>
          <span className="text-xs font-medium text-slate-400">
            {completed === 1 ? "1 completed" : `${completed} completed`}
          </span>
        </div>
      </div>

      {/* Card 3: Active Event Types */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-600">
            Active Event Types
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-primary">
            <Layers className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900">
            {activeEvents}
          </span>
          <span className="text-xs font-medium text-slate-400">
            {activeEvents === 1 ? "1 active link" : `${activeEvents} active links`}
          </span>
        </div>
      </div>

      {/* Card 4: Review Hours */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-600">
            Review Hours
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-primary">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900">
            {hoursLogged}h
          </span>
          <span className="text-xs font-medium text-slate-400">
            Hours logged
          </span>
        </div>
      </div>
    </div>
  );
};
