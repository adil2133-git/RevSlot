"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CalendarDays } from "lucide-react";

import {
  fetchCalendarStatus,
  getGoogleConnectUrl,
} from "@/features/calendar/api/calendarApi";

// Pages a reviewer can't use until Google Calendar is connected.
const GATED_PREFIXES = ["/availability", "/dashboard/event-types"];


export default function CalendarRequiredGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isGated = GATED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // null = still checking
  const [connected, setConnected] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (!isGated) return;

    let cancelled = false;
    setConnected(null);

    fetchCalendarStatus()
      .then((status) => {
        if (!cancelled) setConnected(status.googleCalendarConnected);
      })
      .catch(() => {
        // If the status check itself fails, don't lock the reviewer out.
        if (!cancelled) setConnected(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isGated, pathname]);

  const handleConnect = async () => {
    setBusy(true);
    setError(null);

    try {
      const url = await getGoogleConnectUrl();
      window.location.href = url;
    } catch {
      setError("Couldn't start Google connection. Please try again.");
      setBusy(false);
    }
  };

  if (!isGated || connected === true) {
    return <>{children}</>;
  }

  if (connected === null) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-primary" />
      </div>
    );
  }

   return (
    <div className="relative min-h-[520px]">
      {/* Real page content, blurred and non-interactive */}
      <div
        aria-hidden="true"
        inert
        className="pointer-events-none select-none opacity-90 blur-[1.5px]"
      >
        {children}
      </div>

      {/* Overlay + modal card */}
      <div className="absolute inset-0 z-10 flex items-start justify-center bg-white/20 px-4 pt-16">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="calendar-gate-title"
          className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/10"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-primary">
            <CalendarDays className="h-6 w-6" />
          </div>

          <h2
            id="calendar-gate-title"
            className="mt-4 text-lg font-bold text-slate-900"
          >
            Connect Google Calendar first
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            We create a Google Meet link for every booking through your
            calendar. Connect it before setting up availability and event
            types, otherwise your clients won&apos;t get a meeting link.
          </p>

          {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

          <button
            type="button"
            onClick={handleConnect}
            disabled={busy}
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/95 disabled:opacity-60"
          >
            {busy ? "Redirecting…" : "Connect Google Calendar"}
          </button>
        </div>
      </div>
    </div>
  );
}