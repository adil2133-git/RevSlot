"use client";

import { useEffect, useState } from "react";
import {
  useSearchParams,
  useRouter,
  usePathname,
} from "next/navigation";

import {
  fetchCalendarStatus,
  getGoogleConnectUrl,
  disconnectGoogleCalendar,
} from "../api/calendarApi";

const CalendarIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M3 9h18" />
    <path d="M8 2v4M16 2v4" />
  </svg>
);

export default function GoogleCalendarCard() {
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const loadStatus = () => {
    fetchCalendarStatus()
      .then((status) => {
        setConnected(status.googleCalendarConnected);
        setEmail(status.googleCalendarEmail);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStatus();
  }, []);

  // After the Google OAuth redirect lands back on
  // /dashboard?calendar=connected|error
  useEffect(() => {
    const result = searchParams.get("calendar");

    if (result) {
      loadStatus();
      router.replace(pathname);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleConnect = async () => {
    setBusy(true);

    try {
      const url = await getGoogleConnectUrl();

      window.location.href = url;
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setBusy(true);

    try {
      await disconnectGoogleCalendar();

      setConnected(false);
      setEmail(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-5 flex items-center justify-between rounded-xl border border-slate-100 bg-surface-card p-5 shadow-surface">

      <div className="flex items-center gap-4">

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary">
          <CalendarIcon />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-on-surface">
            Google Calendar
          </h3>

          <p className="text-sm text-slate-600">
            {loading
              ? "Checking connection…"
              : connected
              ? `Connected as ${email} — Meet links are auto-added to bookings.`
              : "Connect it so every booking gets a Google Meet link automatically."}
          </p>
        </div>

      </div>

      {!loading && (
        <button
          onClick={
            connected
              ? handleDisconnect
              : handleConnect
          }
          disabled={busy}
          className={
            connected
              ? "shrink-0 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-on-surface disabled:opacity-60"
              : "shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-surface disabled:opacity-60"
          }
        >
          {connected ? "Disconnect" : "Connect"}
        </button>
      )}

    </div>
  );
}