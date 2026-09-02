"use client";

import React, { useState } from "react";
import dayjs from "dayjs";
import type { TodaysScheduleItem } from "../type";

interface TodaysScheduleProps {
  schedule: TodaysScheduleItem[];
  selectedDate?: string;
  onOpenReferenceDrawer: (bookingId: number) => void;
}

export const TodaysSchedule: React.FC<TodaysScheduleProps> = ({
  schedule,
  selectedDate,
  onOpenReferenceDrawer,
}) => {
  const [filter, setFilter] = useState<"all" | "pending">("all");

  const formattedDate = selectedDate
    ? dayjs(selectedDate).format("MMM D, YYYY")
    : dayjs().format("MMM D, YYYY");

  const filteredSchedule = schedule.filter((item) => {
    if (filter === "pending") {
      return item.status === "confirmed" && dayjs(item.startTime).isAfter(dayjs());
    }
    return true;
  });

  return (
    <div className="rounded-xl border border-slate-200/80 bg-surface-card p-6 shadow-surface">
      {/* Header with Title and Filter Tabs */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-on-surface">
            Today&apos;s Schedule <span className="font-normal text-slate-500">({formattedDate})</span>
          </h2>
        </div>

        <div className="inline-flex rounded-full bg-slate-100 p-0.5 text-xs font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-full px-3.5 py-1 transition-colors ${
              filter === "all"
                ? "bg-primary text-on-primary shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("pending")}
            className={`rounded-full px-3.5 py-1 transition-colors ${
              filter === "pending"
                ? "bg-primary text-on-primary shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Pending
          </button>
        </div>
      </div>

      {/* Schedule Items List */}
      {filteredSchedule.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-surface-card p-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-on-surface">No review sessions scheduled for today</p>
          <p className="mt-1 text-xs text-slate-500">Upcoming bookings will appear here automatically.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {filteredSchedule.map((item) => {
            const startFmt = dayjs(item.startTime).format("hh:mm A");
            const endFmt = dayjs(item.endTime).format("hh:mm A");

            return (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-surface-card p-4 transition-all hover:border-slate-300 hover:shadow-raised md:flex-row md:items-center md:justify-between"
              >
                {/* Time & Session Info */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                  {/* Vertical Time Block */}
                  <div className="flex flex-col border-l-2 border-primary pl-3 sm:w-28 sm:border-l-0 sm:border-r sm:border-slate-200 sm:pr-4 sm:pl-0">
                    <span className="text-sm font-bold text-on-surface">{startFmt}</span>
                    <span className="text-xs text-slate-500">{endFmt}</span>
                  </div>

                  {/* Details */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-on-surface">{item.internName}</span>
                      {item.batch && (
                        <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold text-primary">
                          {item.batch}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs font-semibold text-slate-700">{item.weekStage || item.eventTypeName}</p>
                    {item.advisorName && (
                      <p className="mt-1 text-[11px] text-slate-500">
                        Advisor: <span className="font-medium text-slate-700">{item.advisorName}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Badge & Actions */}
                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
                  {/* Status Badge */}
                  <div>
                    {item.status === "confirmed" ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Confirmed
                      </span>
                    ) : item.status === "completed" ? (
                      <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary">
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        Pending Prep
                      </span>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenReferenceDrawer(item.id)}
                      className="rounded-lg border border-slate-200/80 bg-surface-card px-3 py-1.5 text-xs font-semibold text-on-surface shadow-2xs transition-colors hover:bg-slate-50"
                    >
                      View Reference
                    </button>

                    {item.meetLink ? (
                      <a
                        href={item.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-on-primary shadow-surface transition-shadow hover:shadow-raised"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="23 7 16 12 23 17 23 7" />
                          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                        Join Meet
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-400"
                      >
                        Join Meet
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
