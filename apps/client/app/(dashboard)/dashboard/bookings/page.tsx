"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RefreshIcon, CalendarIcon } from "@/features/booking/components/icons";
import BookingCard from "@/features/booking/components/BookingCard";
import BookingDetailsModal from "@/features/booking/components/BookingDetailsModal";
import CancelBookingModal from "@/features/booking/components/CancelBookingModal";
import RescheduleBookingModal from "@/features/booking/components/RescheduleBookingModal";
import SubmitFeedbackModal from "@/features/feedback/components/SubmitFeedbackModal";
import Pagination from "@/features/booking/components/Pagination";
import { fetchMyBookings, markBookingOutcome, fetchBookingById } from "@/features/booking/api/bookingApi";
import type { MyBooking, BookingTabCounts } from "@/features/booking/type";
import FeedbackDetailsModal from "@/features/feedback/components/FeedbackDetailsModal";

type BookingFilterTab = "all" | "ongoing" | "upcoming" | "reschedule_requested" | "completed" | "rescheduled" | "cancelled" | "no_show";

const FILTER_TABS: { id: BookingFilterTab; label: string }[] = [
  { id: "all", label: "All Bookings" },
  { id: "ongoing", label: "Ongoing" },
  { id: "upcoming", label: "Upcoming" },
  { id: "reschedule_requested", label: "Reschedule Requests" },
  { id: "completed", label: "Completed" },
  { id: "rescheduled", label: "Rescheduled" },
  { id: "cancelled", label: "Cancelled" },
  { id: "no_show", label: "No-show" },
];

function BookingsContent() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab") as BookingFilterTab | null;
  const [activeTab, setActiveTab] = useState<BookingFilterTab>(tabFromUrl || "all");

  useEffect(() => {
    if (tabFromUrl && FILTER_TABS.some((t) => t.id === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [tabCounts, setTabCounts] = useState<BookingTabCounts | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [selectedDetailsBooking, setSelectedDetailsBooking] = useState<MyBooking | null>(null);
  const [selectedCancelBooking, setSelectedCancelBooking] = useState<MyBooking | null>(null);
  const [selectedRescheduleBooking, setSelectedRescheduleBooking] = useState<MyBooking | null>(null);
  const [selectedFeedbackBooking, setSelectedFeedbackBooking] = useState<MyBooking | null>(null);
  const [selectedViewFeedbackBooking, setSelectedViewFeedbackBooking] = useState<MyBooking | null>(null);
  const [markingOutcomeId, setMarkingOutcomeId] = useState<number | null>(null);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);

      let scopeParam: "upcoming" | "past" | "ongoing" | undefined = undefined;
      let statusParam: ("confirmed" | "completed" | "rescheduled" | "cancelled" | "no_show" | "reschedule_requested")[] | undefined = undefined;

      if (activeTab === "ongoing") {
        scopeParam = "ongoing";
      } else if (activeTab === "upcoming") {
        scopeParam = "upcoming";
      } else if (activeTab === "reschedule_requested") {
        statusParam = ["reschedule_requested"];
      } else if (activeTab === "completed") {
        statusParam = ["completed"];
      } else if (activeTab === "rescheduled") {
        statusParam = ["rescheduled"];
      } else if (activeTab === "cancelled") {
        statusParam = ["cancelled"];
      } else if (activeTab === "no_show") {
        statusParam = ["no_show"];
      }

      const result = await fetchMyBookings({
        page,
        limit: 10,
        status: statusParam,
        scope: scopeParam,
        search: search.trim() || undefined,
      });

      setBookings(result.bookings);
      setTotalPages(result.pagination.totalPages);
      if (result.counts) {
        setTabCounts(result.counts);
      }
      setError(null);
    } catch {
      setError("Failed to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, search]);

  const bookingIdFromUrl = searchParams.get("bookingId");
  const actionFromUrl = searchParams.get("action");
  const [autoOpenedBookingId, setAutoOpenedBookingId] = useState<number | null>(null);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    if (!bookingIdFromUrl || actionFromUrl !== "feedback") return;

    const targetId = Number(bookingIdFromUrl);
    if (!targetId || autoOpenedBookingId === targetId) return;

    const openTargetModal = async () => {
      let targetBooking: MyBooking | null = bookings.find((b) => b.id === targetId) || null;

      if (!targetBooking) {
        try {
          const detail = await fetchBookingById(targetId);
          if (detail) {
            targetBooking = {
              id: detail.id,
              eventTypeId: detail.eventTypeId,
              internName: detail.internName,
              batch: detail.batch,
              advisorName: detail.advisorName,
              advisorEmail: detail.advisorEmail,
              weekStage: detail.weekStage,
              startTime: detail.startTime,
              endTime: detail.endTime,
              status: detail.status,
              meetLink: detail.meetLink,
              cancelledAt: detail.cancelledAt,
              cancelledReason: detail.cancelledReason,
              eventTypeName: detail.eventTypeName,
              bookingWindowDays: 60,
              hasFeedback: detail.hasFeedback,
            };
          }
        } catch {
          return;
        }
      }

      if (!targetBooking) return;

      setAutoOpenedBookingId(targetId);

      if (targetBooking.status === "completed" && !targetBooking.hasFeedback) {
        setSelectedFeedbackBooking(targetBooking);
      } else if (targetBooking.status === "confirmed" && new Date(targetBooking.endTime).getTime() <= Date.now()) {
        try {
          await markBookingOutcome(targetBooking.id, { outcome: "completed" });
          setSelectedFeedbackBooking({
            ...targetBooking,
            status: "completed",
            hasFeedback: false,
          });
          loadBookings();
        } catch {
          setSelectedFeedbackBooking(targetBooking);
        }
      } else if (targetBooking.status === "completed" && targetBooking.hasFeedback) {
        setSelectedViewFeedbackBooking(targetBooking);
      }
    };

    if (!loading) {
      openTargetModal();
    }
  }, [loading, bookings, bookingIdFromUrl, actionFromUrl, autoOpenedBookingId, loadBookings]);

  const handleTabChange = (tab: BookingFilterTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleMarkOutcome = async (booking: MyBooking, outcome: "completed" | "no_show") => {
  if (markingOutcomeId) return;
  setMarkingOutcomeId(booking.id);
  try {
    await markBookingOutcome(booking.id, {outcome});
    await loadBookings();
  } catch (err) {
    setError(err instanceof Error ? err.message : `Failed to mark booking as ${outcome === "completed" ? "completed" : "no-show"}.`);
  } finally {
    setMarkingOutcomeId(null);
  }
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

      {/* Live Search Bar */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by intern name, batch, stage, advisor..."
          className="w-full rounded-xl border border-slate-200 bg-surface-card pl-10 pr-4 py-2.5 text-xs font-medium text-on-surface placeholder:text-slate-400 shadow-2xs focus:border-primary focus:outline-none"
        />
      </div>

      {/* Clean Filter Tabs Bar */}
      <div className="mb-6 rounded-xl border border-slate-200/80 bg-surface-card p-2 shadow-surface">
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTER_TABS.map((tab) => {
            const count = tabCounts?.[tab.id];
            const isActive = activeTab === tab.id;
            const isOngoing = tab.id === "ongoing";
            const isRescheduleReq = tab.id === "reschedule_requested";
            const hasOngoing = isOngoing && count !== undefined && count > 0;
            const hasRescheduleReq = isRescheduleReq && count !== undefined && count > 0;

            let extraStyle = "text-slate-600 hover:bg-slate-100 hover:text-on-surface";
            if (isActive) {
              extraStyle = "bg-[#003366] text-white shadow-2xs";
            } else if (hasOngoing) {
              extraStyle = "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100";
            } else if (hasRescheduleReq) {
              extraStyle = "bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100";
            }

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${extraStyle}`}
              >
                <span>{tab.label}</span>

                {isOngoing && (
                  <span className={`inline-block h-2 w-2 rounded-full ${hasOngoing ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                )}

                {(hasOngoing || hasRescheduleReq) && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-all ${
                      isActive
                        ? "bg-white/20 text-white"
                        : hasRescheduleReq
                        ? "bg-purple-200 text-purple-900"
                        : "bg-emerald-200 text-emerald-900"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
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
              : activeTab === "no_show"
              ? "No no-show bookings found."
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
                onMarkCompleted={(b) => handleMarkOutcome(b, "completed")}
                onMarkNoShow={(b) => handleMarkOutcome(b, "no_show")}
                onLeaveFeedback={(b) => setSelectedFeedbackBooking(b)}
                onViewFeedback={(b) => setSelectedViewFeedbackBooking(b)}
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

      {selectedFeedbackBooking && (
        <SubmitFeedbackModal
          booking={selectedFeedbackBooking}
          onClose={() => setSelectedFeedbackBooking(null)}
          onSubmitted={() => {
            setSelectedFeedbackBooking(null);
            loadBookings();
          }}
        />
      )}

      {selectedViewFeedbackBooking && (
        <FeedbackDetailsModal
          bookingId={selectedViewFeedbackBooking.id}
          onClose={() => setSelectedViewFeedbackBooking(null)}
        />
      )}
      
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={null}>
      <BookingsContent />
    </Suspense>
  );
}