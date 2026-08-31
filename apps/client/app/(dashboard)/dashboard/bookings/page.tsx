"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshIcon, CalendarIcon } from "@/features/booking/components/icons";
import StatusFilterChips from "@/features/booking/components/StatusFilterChips";
import ScopeToggle from "@/features/booking/components/ScopeToggle";
import BookingCard from "@/features/booking/components/BookingCard";
import BookingDetailsModal from "@/features/booking/components/BookingDetailsModal";
import CancelBookingModal from "@/features/booking/components/CancelBookingModal";
import RescheduleBookingModal from "@/features/booking/components/RescheduleBookingModal";
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

  // Modal states
  const [selectedDetailsBooking, setSelectedDetailsBooking] = useState<MyBooking | null>(null);
  const [selectedCancelBooking, setSelectedCancelBooking] = useState<MyBooking | null>(null);
  const [selectedRescheduleBooking, setSelectedRescheduleBooking] = useState<MyBooking | null>(null);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchMyBookings({
        page,
        limit: 10,
        status: statusFilter === "all" ? undefined : statusFilter === "confirmed" ? ["confirmed", "rescheduled"] : [statusFilter],
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
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface">Bookings</h1>
          <p className="mt-1 text-sm text-slate-500">View and manage your upcoming and past bookings.</p>
        </div>
        <button
          onClick={loadBookings}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-surface-card px-3.5 py-2 text-xs font-semibold text-on-surface shadow-2xs transition-all hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshIcon className={loading ? "animate-spin text-primary" : "text-slate-500"} />
          Refresh
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-surface-card p-3 shadow-2xs">
        <StatusFilterChips value={statusFilter} onChange={handleStatusChange} />
        <ScopeToggle value={scope} onChange={handleScopeChange} />
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-slate-100 bg-surface-card/60" />
          ))}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-error-container p-4 text-sm text-error">
          {error}
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-surface-card p-12 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <CalendarIcon />
          </div>
          <h3 className="text-sm font-semibold text-on-surface">No bookings found</h3>
          <p className="mt-1 text-xs text-slate-500">
            {scope === "upcoming"
              ? "You have no upcoming bookings scheduled."
              : "No bookings match your selected filters."}
          </p>
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <>
          <div className="space-y-3.5">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onViewDetails={(b) => setSelectedDetailsBooking(b)}
                onCancel={(b) => setSelectedCancelBooking(b)}
                onReschedule={(b) => setSelectedRescheduleBooking(b)}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          )}
        </>
      )}

      {selectedDetailsBooking && (
        <BookingDetailsModal
          bookingId={selectedDetailsBooking.id}
          onClose={() => setSelectedDetailsBooking(null)}
        />
      )}

      {selectedCancelBooking && (
        <CancelBookingModal
          booking={selectedCancelBooking}
          onClose={() => setSelectedCancelBooking(null)}
          onCancelled={() => {
            setSelectedCancelBooking(null);
            loadBookings();
          }}
        />
      )}

      {selectedRescheduleBooking && (
        <RescheduleBookingModal
          booking={selectedRescheduleBooking}
          onClose={() => setSelectedRescheduleBooking(null)}
          onRescheduled={() => {
            setSelectedRescheduleBooking(null);
            loadBookings();
          }}
        />
      )}
    </div>
  );
}