"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshIcon, CalendarIcon } from "@/features/booking/components/icons";
import BookingCard from "@/features/booking/components/BookingCard";
import BookingDetailsModal from "@/features/booking/components/BookingDetailsModal";
import CancelBookingModal from "@/features/booking/components/CancelBookingModal";
import RescheduleBookingModal from "@/features/booking/components/RescheduleBookingModal";
import Pagination from "@/features/booking/components/Pagination";
import { fetchMyBookings } from "@/features/booking/api/bookingApi";
import type { MyBooking } from "@/features/booking/type";

type BookingFilterTab = "all" | "ongoing" | "upcoming" | "completed" | "rescheduled" | "cancelled";

const FILTER_TABS: { id: BookingFilterTab; label: string }[] = [
  { id: "all", label: "All Bookings" },
  { id: "ongoing", label: "Ongoing" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "rescheduled", label: "Rescheduled" },
  { id: "cancelled", label: "Cancelled" },
];

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<BookingFilterTab>("all");
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

      let scopeParam: "upcoming" | "past" | "ongoing" | undefined = undefined;
      let statusParam: ("confirmed" | "completed" | "rescheduled" | "cancelled")[] | undefined = undefined;

      if (activeTab === "ongoing") {
        scopeParam = "ongoing";
      } else if (activeTab === "upcoming") {
        scopeParam = "upcoming";
      } else if (activeTab === "completed") {
        statusParam = ["completed"];
      } else if (activeTab === "rescheduled") {
        statusParam = ["rescheduled"];
      } else if (activeTab === "cancelled") {
        statusParam = ["cancelled"];
      }

      const result = await fetchMyBookings({
        page,
        limit: 10,
        status: statusParam,
        scope: scopeParam,
      });

      setBookings(result.bookings);
      setTotalPages(result.pagination.totalPages);
      setError(null);
    } catch {
      setError("Failed to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, activeTab]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleTabChange = (tab: BookingFilterTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Bookings</h1>
          <p className="mt-1 text-sm text-slate-500">View and manage your project review sessions.</p>
        </div>
        <div>
          <button
            onClick={loadBookings}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-surface-card px-4 py-2 text-xs font-semibold text-on-surface shadow-2xs transition-all hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshIcon className={loading ? "animate-spin text-primary" : "text-slate-500"} />
            Refresh
          </button>
        </div>
      </div>

      {/* Clean Filter Tabs Bar (No scrollbars, clean wrap) */}
      <div className="mb-6 rounded-xl border border-slate-200/80 bg-surface-card p-1.5 shadow-surface">
        <div className="flex flex-wrap items-center gap-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-on-primary shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-on-surface"
              }`}
            >
              {tab.label}
              {tab.id === "ongoing" && (
                <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-slate-200/80 bg-surface-card" />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && bookings.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-surface-card p-12 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary">
            <CalendarIcon />
          </div>
          <h3 className="text-sm font-semibold text-on-surface">No bookings found</h3>
          <p className="mt-1 text-xs text-slate-500">
            {activeTab === "ongoing"
              ? "No review sessions are currently in progress right now."
              : activeTab === "upcoming"
              ? "You have no upcoming review bookings."
              : activeTab === "completed"
              ? "No completed bookings found."
              : activeTab === "rescheduled"
              ? "No rescheduled bookings found."
              : activeTab === "cancelled"
              ? "No cancelled bookings found."
              : "No bookings match your filter."}
          </p>
        </div>
      )}

      {/* Bookings List */}
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

      {/* Modals */}
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