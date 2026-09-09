"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useNotificationStore } from "../store/notificationStore";
import type { Notification, NotificationType } from "../types";

dayjs.extend(relativeTime);

const POLL_INTERVAL_MS = 30_000;

const DOT_COLOR: Record<NotificationType, string> = {
  booking_created: "bg-primary",
  booking_cancelled: "bg-error",
  booking_rescheduled: "bg-amber-500",
  booking_completed: "bg-emerald-500",
  feedback_submitted: "bg-secondary",
};

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export default function NotificationBell() {
  const router = useRouter();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } =
    useNotificationStore();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setOpen(false);
    if (notification.bookingId) {
      router.push("/dashboard/bookings");
    }
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-surface-hover hover:text-on-surface"
        aria-label="Notifications"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-100 bg-surface-card shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h4 className="text-sm font-bold text-on-surface">Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">
                No notifications yet.
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex w-full items-start gap-2.5 border-b border-slate-50 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-hover ${
                    n.isRead ? "" : "bg-secondary/30"
                  }`}
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT_COLOR[n.type]}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-on-surface">{n.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.message}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{dayjs(n.createdAt).fromNow()}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}