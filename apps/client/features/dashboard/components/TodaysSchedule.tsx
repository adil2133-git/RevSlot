"use client";

import React, { useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import {
  Calendar,
  ArrowRight,
  Video,
  Check,
  UserX,
  FileText,
} from "lucide-react";
import type { TodaysScheduleItem } from "../type";
import StatusBadge from "@/features/booking/components/StatusBadge";
import { markBookingOutcome } from "@/features/booking/api/bookingApi";

interface TodaysScheduleProps {
  schedule: TodaysScheduleItem[];
  nextReview?: TodaysScheduleItem | null;
  username?: string;
  selectedDate?: string;
  onOpenReferenceDrawer: (bookingId: number) => void;
  onOutcomeChanged?: () => void;
  onViewDetails?: (bookingId: number) => void;
}

export const TodaysSchedule: React.FC<TodaysScheduleProps> = ({
  schedule,
  nextReview,
  username,
  selectedDate,
  onOpenReferenceDrawer,
  onOutcomeChanged,
  onViewDetails,
}) => {
  const [filter, setFilter] = useState<"all" | "pending">("all");
  const [outcomeToConfirm, setOutcomeToConfirm] = useState<{
    item: TodaysScheduleItem;
    outcome: "completed" | "no_show";
  } | null>(null);
  const [markingId, setMarkingId] = useState<number | null>(null);

  const handleConfirmOutcome = async () => {
    if (!outcomeToConfirm) return;
    const { item, outcome } = outcomeToConfirm;
    setMarkingId(item.id);
    try {
      await markBookingOutcome(item.id, { outcome });
      onOutcomeChanged?.();
    } finally {
      setMarkingId(null);
      setOutcomeToConfirm(null);
    }
  };

  const todayDisplay = selectedDate
    ? dayjs(selectedDate).format("dddd, MMM D, YYYY")
    : dayjs().format("dddd, MMM D, YYYY");

  const filteredSchedule = schedule.filter((item) => {
    if (filter === "pending") {
      return item.status === "confirmed" && dayjs(item.startTime).isAfter(dayjs());
    }
    return true;
  });

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden mb-6">
      {/* Header with Title, Tabs, and Calendar Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-primary">
            <Calendar className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              Today&apos;s Schedule
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {todayDisplay}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Segmented Filter Pills */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-lg px-3 py-1 transition-all ${
                filter === "all"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              All Reviews ({schedule.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("pending")}
              className={`rounded-lg px-3 py-1 transition-all ${
                filter === "pending"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Pending Feedback
            </button>
          </div>

          {/* Open Full Calendar Link */}
          <Link
            href="/dashboard/bookings"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <span>Open Full Calendar</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Schedule Content */}
      {filteredSchedule.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
          {/* Illustrated Calendar Icon with checkmark badge */}
          <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-primary">
            <Calendar className="h-8 w-8 text-primary" />
            <div className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white ring-2 ring-white">
              <Check className="h-3.5 w-3.5" />
            </div>
          </div>

          <h3 className="text-xl font-bold tracking-tight text-slate-900">
            Clear schedule for today
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed">
            {nextReview ? (
              <>
                You don&apos;t have any review sessions scheduled for today. Your next upcoming review is on{" "}
                <strong className="text-slate-700">
                  {dayjs(nextReview.startTime).format("dddd, MMM D [at] hh:mm A")}
                </strong>.
              </>
            ) : (
              "You don't have any review sessions scheduled for today."
            )}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {username && (
              <Link
                href={`/${username}`}
                target="_blank"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-all"
              >
                Preview Booking Page
              </Link>
            )}
            <Link
              href="/availability"
              className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary/95 transition-all hover:scale-[1.02]"
            >
              Adjust Working Hours
            </Link>
          </div>
        </div>
      ) : (
        /* Active Schedule Items */
        <div className="divide-y divide-slate-100 p-4 sm:p-6 space-y-3">
          {filteredSchedule.map((item) => {
            const startFmt = dayjs(item.startTime).format("hh:mm A");
            const endFmt = dayjs(item.endTime).format("hh:mm A");

            const now = Date.now();
            const startTs = new Date(item.startTime).getTime();
            const endTs = new Date(item.endTime).getTime();
            const graceEnd = startTs + 10 * 60 * 1000;

            const isActive = item.status === "confirmed" || item.status === "rescheduled";
            const isInProgress = isActive && now >= startTs && now < endTs;
            const isOutcomeRequired = isActive && now >= endTs;
            const canMarkNoShow = isActive && now >= graceEnd;
            const isJoinAvailable =
              isActive &&
              now >= startTs - 10 * 60 * 1000 &&
              now < endTs &&
              !!item.meetLink;

            const displayStatus = isOutcomeRequired
              ? "outcome_required"
              : isInProgress
              ? "in_progress"
              : item.status;

            const isMarking = markingId === item.id;

            return (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:border-slate-300 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex flex-col border-l-2 border-primary pl-3 sm:w-28 sm:border-l-0 sm:border-r sm:border-slate-200 sm:pr-4 sm:pl-0">
                    <span className="text-sm font-bold text-slate-900">{startFmt}</span>
                    <span className="text-xs text-slate-500">{endFmt}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{item.internName}</span>
                      {item.batch && (
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-primary">
                          {item.batch}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs font-semibold text-slate-700">
                      {item.weekStage || item.eventTypeName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isOutcomeRequired && <StatusBadge status={displayStatus} />}

                  {isOutcomeRequired && (
                    <button
                      type="button"
                      disabled={isMarking}
                      onClick={() => setOutcomeToConfirm({ item, outcome: "completed" })}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Mark Completed
                    </button>
                  )}

                  {canMarkNoShow && (
                    <button
                      type="button"
                      disabled={isMarking}
                      onClick={() => setOutcomeToConfirm({ item, outcome: "no_show" })}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      Mark No-show
                    </button>
                  )}

                  {isJoinAvailable ? (
                    <a
                      href={item.meetLink!}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary/95"
                    >
                      <Video className="h-3.5 w-3.5" />
                      Join Meet
                    </a>
                  ) : null}

                  {onViewDetails && (
                    <button
                      onClick={() => onViewDetails(item.id)}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
                      title="View Details"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Real Upcoming Defense Preview Bar (ONLY rendered when a real next review exists) */}
      {nextReview && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-600">
            <Calendar className="h-4 w-4 text-primary shrink-0" />
            <span>
              <strong className="text-slate-800">
                {dayjs(nextReview.startTime).format("ddd, MMM D • hh:mm A")}
              </strong>{" "}
              — {nextReview.eventTypeName} ({nextReview.internName})
            </span>
          </div>

          {onViewDetails && (
            <button
              onClick={() => onViewDetails(nextReview.id)}
              className="font-bold text-primary hover:underline flex items-center gap-1 shrink-0"
            >
              <span>View Details</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Confirmation Outcome Modal */}
      {outcomeToConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900">
              {outcomeToConfirm.outcome === "completed"
                ? "Mark session as completed?"
                : "Mark booking as no-show?"}
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              {outcomeToConfirm.outcome === "completed"
                ? "This will mark the session as completed and allow feedback to be submitted."
                : "This will mark the booking as no-show and feedback will not be required."}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOutcomeToConfirm(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmOutcome}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs ${
                  outcomeToConfirm.outcome === "completed"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {outcomeToConfirm.outcome === "completed"
                  ? "Mark Completed"
                  : "Mark No-show"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
