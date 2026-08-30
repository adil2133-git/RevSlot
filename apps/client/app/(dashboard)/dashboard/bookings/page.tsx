"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshIcon } from "@/features/booking/components/icons";
import StatusFilterChips from "@/features/booking/components/StatusFilterChips";
import ScopeToggle from "@/features/booking/components/ScopeToggle";
import BookingCard from "@/features/booking/components/BookingCard";
import Pagination from "@/features/booking/components/Pagination";
import { fetchMyBookings } from "@/features/booking/api/bookingApi";
import type { MyBooking } from "@/features/booking/type";

type StatusFilter = "all" | "confirmed" | "completed";
type Scope = "upcoming" | "past" | "all";

export default function BookingsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [scope, setScope] = useState<Scope>("upcoming");
  const [page, setPage] = useState(1);

  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchMyBookings({
        page,
        limit: 10,
        status: statusFilter === "all" ? undefined : [statusFilter],
        scope: scope === "all" ? undefined : scope,
      });
      setBookings(result.bookings);
      setTotalPages(result.pagination.totalPages);
      setError(null);
    } catch {
      setError("Failed to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, scope]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleStatusChange = (value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleScopeChange = (value: Scope) => {
    setScope(value);
    setPage(1);
  };

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Bookings</h1>
          <p className="mt-1 text-slate-400">View and manage your upcoming and past bookings.</p>
        </div>
        <button
          onClick={loadBookings}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-hover"
        >
          <RefreshIcon />
          Refresh
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-100 bg-surface-card p-4 shadow-surface">
        <StatusFilterChips value={statusFilter} onChange={handleStatusChange} />
        <ScopeToggle value={scope} onChange={handleScopeChange} />
      </div>

      {loading && <p className="text-slate-400">Loading...</p>}
      {error && <p className="text-error">{error}</p>}

      {!loading && !error && bookings.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
          No bookings found.
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <>
          <div className="space-y-4">
            {bookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}