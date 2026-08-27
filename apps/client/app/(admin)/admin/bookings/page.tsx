"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "@/features/admin/store/adminStore";
import type { BookingStatus } from "@/features/admin/types";

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
  no_show: "bg-red-50 text-red-700",
  rescheduled: "bg-amber-50 text-amber-700",
};

const STATUS_OPTIONS: { value: BookingStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No-show" },
  { value: "rescheduled", label: "Rescheduled" },
];

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    ", " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function AdminBookingsPage() {
  const { bookings, bookingsPagination, isLoading, fetchBookings } = useAdminStore();
  const [status, setStatus] = useState<BookingStatus | "all">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchBookings({
      status: status === "all" ? undefined : status,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      page,
      limit: 20,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, fromDate, toDate, page]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-1.5 text-2xl font-semibold tracking-tight text-on-surface">
          Bookings Oversight
        </h1>
        <p className="text-sm text-slate-600">All bookings across the platform.</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as BookingStatus | "all"); setPage(1); }}
          className="rounded-lg border border-slate-200 bg-surface-card px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-200 bg-surface-card px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
        />
        <span className="text-sm text-slate-400">to</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => { setToDate(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-200 bg-surface-card px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-surface-card shadow-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-surface text-left text-xs font-medium text-slate-400">
              <th className="px-5 py-3 font-medium">Reviewer</th>
              <th className="px-5 py-3 font-medium">Intern / Batch</th>
              <th className="px-5 py-3 font-medium">Advisor</th>
              <th className="px-5 py-3 font-medium">Event Type</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && bookings.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">Loading…</td></tr>
            )}
            {!isLoading && bookings.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">No bookings found</td></tr>
            )}
            {bookings.map((b) => (
              <tr key={b.id} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-3 font-medium text-on-surface">{b.reviewerName}</td>
                <td className="px-5 py-3 text-slate-600">{b.internName} · {b.batch}</td>
                <td className="px-5 py-3 text-slate-600">{b.advisorEmail}</td>
                <td className="px-5 py-3 text-slate-600">{b.eventTypeName}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status ?? "confirmed"]}`}>
                    {(b.status ?? "confirmed").replace("_", " ")}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-500">{formatDateTime(b.startTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {bookingsPagination && bookingsPagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            Page {bookingsPagination.page} of {bookingsPagination.totalPages} · {bookingsPagination.total} total
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium disabled:opacity-40"
            >
              Prev
            </button>
            <button
              disabled={page >= bookingsPagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}