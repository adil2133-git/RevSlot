"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Calendar,
  Info,
  TrendingUp,
  Clock,
  ShieldCheck,
  RotateCcw,
  ArrowRight,
  Contact,
  CheckCircle2,
  CalendarX2,
} from "lucide-react";
import { useAdminStore } from "@/features/admin/store/adminStore";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatBookingTime(isoDate: string) {
  const d = new Date(isoDate);
  const isToday = new Date().toDateString() === d.toDateString();
  const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Today, ${timeStr}`;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeStr}`;
}

export default function AdminDashboardPage() {
  const { stats, bookings, isLoading, fetchStats, fetchBookings } = useAdminStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchBookings({ limit: 5 });
  }, [fetchStats, fetchBookings]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStats(), fetchBookings({ limit: 5 })]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const totalReviewers = stats?.totalReviewers ?? 0;
  const activeReviewers = stats?.activeReviewers ?? 0;
  const inactiveReviewers = Math.max(0, totalReviewers - activeReviewers);
  const bookingsThisWeek = stats?.bookingsThisWeek ?? 0;
  const weekChangePct = stats?.bookingsWeekChangePct;
  const noShowRate = stats?.noShowRatePct ?? 0;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Title & Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Monitor platform performance and scheduling activity
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer shrink-0"
        >
          <RotateCcw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 2. Top 3 Real Metric Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Card 1: TOTAL REVIEWERS */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Reviewers
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-primary">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {totalReviewers}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 text-xs font-bold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>{activeReviewers} Active</span>
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{activeReviewers} verified active in roster</span>
          </div>
        </div>

        {/* Card 2: BOOKINGS THIS WEEK */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Bookings This Week
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-primary">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {bookingsThisWeek}
            </span>
            {typeof weekChangePct === "number" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 text-xs font-bold text-primary">
                <TrendingUp className="h-3 w-3 text-primary" />
                <span>{weekChangePct >= 0 ? `+${weekChangePct}%` : `${weekChangePct}%`} vs last week</span>
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Active evaluation schedule</span>
          </div>
        </div>

        {/* Card 3: NO-SHOW RATE */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              No-Show Rate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Info className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {noShowRate}%
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 text-xs font-bold text-primary">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>{noShowRate <= 5 ? "In Compliance" : "Action Required"}</span>
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="truncate">Target &lt; 5% institutional standard</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Reviewer Management (Left) & Recent Bookings (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Reviewer Management */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            {/* Top Icon */}
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-primary">
              <Contact className="h-5 w-5" />
            </div>

            <h2 className="text-lg font-extrabold text-slate-900">
              Reviewer Management
            </h2>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              Manage academic evaluator rosters, verify technical competencies, monitor workload balance, and approve onboarding credentials across all active disciplines.
            </p>

            {/* Real Reviewer Status Badges */}
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/60 px-3 py-1 text-xs font-bold text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{activeReviewers} Active Faculty</span>
              </span>
              {inactiveReviewers > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200/80 px-3 py-1 text-xs font-bold text-slate-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span>{inactiveReviewers} Inactive</span>
                </span>
              )}
            </div>
          </div>

          {/* Action CTA Button */}
          <div className="pt-6">
            <Link
              href="/admin/reviewers"
              className="w-full rounded-xl bg-[#002b49] text-white hover:bg-[#00223a] transition-all font-bold text-xs py-3 px-4 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span>View All Reviewers</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Column: Recent Bookings */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-extrabold text-slate-900">
                  Recent Bookings
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#002b49] px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                  <span className="h-1 w-1 rounded-full bg-emerald-400" />
                  <span>Live Feed</span>
                </span>
              </div>
              {bookings.length > 0 && (
                <span className="text-xs text-slate-400 font-medium">
                  Showing latest {Math.min(5, bookings.length)}
                </span>
              )}
            </div>

            {/* Table or Empty State */}
            {isLoading && bookings.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading live session feed...
              </div>
            ) : bookings.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-2.5">
                  <CalendarX2 className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">No bookings recorded yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                  Review sessions scheduled across faculty rosters will appear here in real time.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <th className="py-2.5 pr-3 font-extrabold">Reviewer</th>
                      <th className="py-2.5 pr-3 font-extrabold">Advisor / Intern</th>
                      <th className="py-2.5 pr-3 font-extrabold">Status</th>
                      <th className="py-2.5 font-extrabold">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.slice(0, 5).map((b) => {
                      const isConfirmed = b.status === "confirmed";
                      const isCompleted = b.status === "completed";
                      const isCancelled = b.status === "cancelled" || b.status === "no_show";

                      return (
                        <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Reviewer */}
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-extrabold text-primary border border-blue-100">
                                {getInitials(b.reviewerName || "Reviewer")}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{b.reviewerName || "Reviewer"}</p>
                                <p className="text-[10px] text-slate-400 font-medium">
                                  {b.eventTypeName || "Evaluation"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Advisor / Intern */}
                          <td className="py-3 pr-3">
                            <p className="font-bold text-slate-900">{b.internName || "Candidate"}</p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {b.advisorEmail ? b.advisorEmail.split("@")[0] : b.batch || "Advisory"}
                            </p>
                          </td>

                          {/* Status */}
                          <td className="py-3 pr-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                isConfirmed || isCompleted
                                  ? "bg-blue-50 text-primary border border-blue-200/60"
                                  : isCancelled
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isConfirmed || isCompleted
                                    ? "bg-primary"
                                    : isCancelled
                                    ? "bg-rose-500"
                                    : "bg-slate-400"
                                }`}
                              />
                              <span className="capitalize">{b.status ?? "confirmed"}</span>
                            </span>
                          </td>

                          {/* Time */}
                          <td className="py-3 whitespace-nowrap text-slate-600">
                            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                              <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                              <span>{formatBookingTime(b.startTime)}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer Link */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Link
              href="/admin/bookings"
              className="text-xs font-bold text-[#002b49] hover:underline flex items-center gap-1 transition-colors"
            >
              <span>View All Bookings</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}