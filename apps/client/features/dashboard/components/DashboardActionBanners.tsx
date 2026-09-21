"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, ArrowLeftRight, X, Check } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/authStore";
import WhatsappRequiredModal from "@/components/common/WhatsappRequiredModal";
import {
  fetchCalendarStatus,
  getGoogleConnectUrl,
  disconnectGoogleCalendar,
} from "@/features/calendar/api/calendarApi";

export default function DashboardActionBanners() {
  const user = useAuthStore((state) => state.user);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarDismissed, setCalendarDismissed] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarBusy, setCalendarBusy] = useState(false);

  useEffect(() => {
    fetchCalendarStatus()
      .then((status) => {
        setCalendarConnected(status.googleCalendarConnected);
      })
      .catch(() => {})
      .finally(() => setCalendarLoading(false));
  }, []);

  const handleConnectCalendar = async () => {
    setCalendarBusy(true);
    try {
      const url = await getGoogleConnectUrl();
      window.location.href = url;
    } catch (e) {
      console.error(e);
    } finally {
      setCalendarBusy(false);
    }
  };

  const showWhatsapp = !user?.whatsappNumber;
  const showCalendar = !calendarDismissed;

  if (!showWhatsapp && calendarConnected && calendarDismissed) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Banner 1: Add WhatsApp Number */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs font-bold text-slate-900">
                  Add WhatsApp Number
                </h4>
                <span className="rounded-full bg-blue-50 border border-blue-200/60 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Recommended
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {user?.whatsappNumber
                  ? `Connected: ${user.whatsappNumber}`
                  : "Receive 15-minute alerts and instant defense notifications."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setWhatsappModalOpen(true)}
            className="shrink-0 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-900 px-4 py-2 text-xs font-bold transition-colors"
          >
            {user?.whatsappNumber ? "Edit" : "Add Number"}
          </button>
        </div>

        {/* Banner 2: Connect Google Calendar */}
        {showCalendar && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
                <ArrowLeftRight className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold text-slate-900">
                    Connect Google Calendar
                  </h4>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    Fast Setup
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {calendarConnected
                    ? "2-way sync active with auto-conflict detection."
                    : "2-way calendar sync with auto-conflict detection."}
                </p>
              </div>
            </div>

            {/* Right container: Connect button + Dismiss X placed side-by-side in flex */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={calendarBusy || calendarLoading}
                onClick={calendarConnected ? () => setCalendarDismissed(true) : handleConnectCalendar}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs ${
                  calendarConnected
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-primary text-white hover:bg-primary/95"
                }`}
              >
                {calendarConnected ? (
                  <span className="flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    Synced
                  </span>
                ) : (
                  "Connect"
                )}
              </button>

              <button
                type="button"
                onClick={() => setCalendarDismissed(true)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <WhatsappRequiredModal
        isOpen={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
      />
    </>
  );
}
