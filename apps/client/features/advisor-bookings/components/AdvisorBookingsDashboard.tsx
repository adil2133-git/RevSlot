"use client";

import { useState, useEffect } from "react";
import { advisorApi, clearAdvisorSession } from "../services/advisorApi";
import type { AdvisorBookingItem, AdvisorBookingScope } from "../types";
import AdvisorBookingCard from "./AdvisorBookingCard";
import AdvisorFeedbackModal from "./AdvisorFeedbackModal";
import PoweredByFooter from "@/features/booking/components/PoweredByFooter";

interface AdvisorBookingsDashboardProps {
  advisorEmail: string;
  onLogout: () => void;
}

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SwapIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 16V4M7 4L3 8M7 4L11 8" />
    <path d="M17 8V20M17 20L21 16M17 20L13 16" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export default function AdvisorBookingsDashboard({ advisorEmail, onLogout }: AdvisorBookingsDashboardProps) {
  const [scope, setScope] = useState<AdvisorBookingScope>("upcoming");
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState<AdvisorBookingItem[]>([]);
  const [counts, setCounts] = useState({ upcoming: 0, past: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionModalBooking, setActionModalBooking] = useState<AdvisorBookingItem | null>(null);
  const [feedbackModalBookingId, setFeedbackModalBookingId] = useState<number | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await advisorApi.getBookings(scope, search);
      setBookings(data.bookings);
      setCounts(data.counts);
    } catch (err: any) {
      if (err?.status === 401) {
        clearAdvisorSession();
        onLogout();
        return;
      }
      setError(err?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBookings();
    }, 250);
    return () => clearTimeout(timer);
  }, [scope, search]);

  const handleSwitchEmail = () => {
    clearAdvisorSession();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-surface px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-3">
            <div className="flex items-center gap-2 font-bold text-[#003366] text-xl">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#003366] text-white text-xs font-black">
                R
              </span>
              <span>RevSlot</span>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Bookings</h1>
          
          <div className="mt-3 flex flex-col items-center gap-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#e6eef5] px-3.5 py-1 text-xs font-semibold text-[#003366] border border-[#cbd5e1]/40">
              <CheckIcon />
              <span>{advisorEmail}</span>
              <span className="text-[#003366]/50">•</span>
              <span className="text-[#003366]">Verified</span>
            </div>
            
            <button
              type="button"
              onClick={handleSwitchEmail}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              <span>Use different email</span>
              <SwapIcon />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Upcoming, Past, Cancelled) */}
        <div className="mb-6 rounded-xl bg-slate-100 p-1.5 flex items-center justify-between gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => setScope("upcoming")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              scope === "upcoming"
                ? "bg-[#003366] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Upcoming</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              scope === "upcoming" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
            }`}>
              {counts.upcoming}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setScope("past")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              scope === "past"
                ? "bg-[#003366] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Past</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              scope === "past" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
            }`}>
              {counts.past}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setScope("cancelled")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              scope === "cancelled"
                ? "bg-[#003366] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Cancelled</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              scope === "cancelled" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
            }`}>
              {counts.cancelled}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by intern name, batch, stage..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 shadow-sm focus:border-[#003366] focus:outline-none focus:ring-1 focus:ring-[#003366]"
          />
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 w-full animate-pulse rounded-xl border border-slate-200 bg-white p-5" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-xs text-red-600">
            {error}
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-sm font-semibold text-slate-700">No {scope} bookings found</p>
            <p className="mt-1 text-xs text-slate-400">
              {search ? `No sessions match "${search}". Try clearing your search.` : `There are no ${scope} sessions linked to ${advisorEmail}.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <AdvisorBookingCard
                key={booking.id}
                booking={booking}
                activeTab={scope}
                onActionClick={(b) => setActionModalBooking(b)}
                onViewFeedback={(b) => setFeedbackModalBookingId(b.id)}
              />
            ))}
          </div>
        )}

        {/* Powered By Footer */}
        <div className="mt-12 text-center">
          <PoweredByFooter />
        </div>
      </div>

      {/* Reschedule / Cancel Modal Info Dialog for Upcoming Slots */}
      {actionModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-center">
            <h3 className="text-base font-bold text-slate-900">Manage Booking #{actionModalBooking.slotId || actionModalBooking.id}</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              To reschedule or cancel this slot for <strong>{actionModalBooking.internName}</strong>, please contact reviewer <strong>{actionModalBooking.reviewerName}</strong> or check your booking confirmation email.
            </p>
            <button
              type="button"
              onClick={() => setActionModalBooking(null)}
              className="mt-5 w-full rounded-lg bg-[#003366] py-2 text-xs font-semibold text-white transition hover:bg-[#003366]/90"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* View Feedback Modal for Past Slots */}
      {feedbackModalBookingId && (
        <AdvisorFeedbackModal
          bookingId={feedbackModalBookingId}
          onClose={() => setFeedbackModalBookingId(null)}
        />
      )}
    </div>
  );
}
