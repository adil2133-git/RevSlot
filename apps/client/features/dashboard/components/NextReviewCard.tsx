"use client";

import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  CalendarDays,
  Clock3,
  UserRound,
  Video,
  CircleDot,
} from "lucide-react";
import type { TodaysScheduleItem } from "../type";

interface NextReviewCardProps {
  schedule: TodaysScheduleItem[];
  onViewDetails: (bookingId: number) => void;
}

const formatRemainingTime = (startTime: string, now: number) => {
  const diff = dayjs(startTime).diff(dayjs(now), "second");

  if (diff <= 0) return "Starting now";

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (days > 0) return `Starts in ${days}d ${hours}h`;
  if (hours > 0) return `Starts in ${hours}h ${minutes}m`;

  return `Starts in ${Math.max(minutes, 1)} min`;
};

export const NextReviewCard: React.FC<NextReviewCardProps> = ({
  schedule,
  onViewDetails,
}) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 30_000);

    return () => window.clearInterval(interval);
  }, []);

  const nextReview = useMemo(() => {
    return schedule
      .filter(
        (item) =>
          (item.status === "confirmed" || item.status === "rescheduled") &&
          dayjs(item.endTime).isAfter(dayjs(now))
      )
      .sort(
        (a, b) =>
          dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf()
      )[0];
  }, [schedule, now]);

  if (!nextReview) {
    return null;
  }

  const startTime = dayjs(nextReview.startTime);
  const endTime = dayjs(nextReview.endTime);

  const isInProgress =
    now >= startTime.valueOf() && now < endTime.valueOf();

  const canJoinMeet =
    !!nextReview.meetLink &&
    now >= startTime.subtract(10, "minute").valueOf() &&
    now < endTime.valueOf();

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-surface-card shadow-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full ${
              isInProgress ? "bg-red-50" : "bg-primary/10"
            }`}
          >
            <CircleDot
              size={15}
              className={
                isInProgress ? "text-red-500" : "text-primary"
              }
            />
          </span>

          <span
            className={`text-xs font-bold uppercase tracking-wide ${
              isInProgress ? "text-red-600" : "text-primary"
            }`}
          >
            {isInProgress ? "Live Now" : "Next Review"}
          </span>
        </div>

        {!isInProgress && (
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
            {formatRemainingTime(nextReview.startTime, now)}
          </span>
        )}

        {isInProgress && (
          <span className="rounded-full bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-600">
            Session in progress
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-on-surface">
            {nextReview.eventTypeName}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <UserRound size={15} className="text-slate-400" />
              <span>
                {nextReview.internName}
                {nextReview.batch && ` • ${nextReview.batch}`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <CalendarDays size={15} className="text-slate-400" />
              <span>
                {startTime.format("ddd, MMM D")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Clock3 size={15} className="text-slate-400" />
              <span>
                {startTime.format("hh:mm A")} –{" "}
                {endTime.format("hh:mm A")}
              </span>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            {isInProgress
              ? "Your review session is currently active."
              : "Next up in your review schedule."}
          </p>
        </div>

         {/* Actions */}
<div className="flex shrink-0 flex-wrap items-center gap-2">
  <button
    type="button"
    onClick={() => onViewDetails(nextReview.id)}
    className="inline-flex min-w-[120px] items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
  >
    View Details
  </button>

  {canJoinMeet ? (
    <a
      href={nextReview.meetLink!}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-on-primary shadow-surface transition hover:shadow-raised"
    >
      <Video size={15} />
      Join Meet
    </a>
  ) : (
    <button
      type="button"
      disabled
      className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-400"
    >
      <Video size={15} />
      Join Meet
    </button>
  )}
</div>
      </div>
    </div>
  );
};