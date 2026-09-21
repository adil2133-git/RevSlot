"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useNotificationStore } from "../store/notificationStore";
import type { Notification, NotificationType } from "../types";

dayjs.extend(relativeTime);

const DOT_COLOR: Record<NotificationType, string> = {
  booking_created: "bg-primary",
  booking_cancelled: "bg-error",
  booking_rescheduled: "bg-amber-500",
  booking_completed: "bg-emerald-500",
  feedback_submitted: "bg-secondary",
  session_reminder: "bg-blue-500",
  dispute_filed: "bg-rose-600",
  dispute_resolved: "bg-purple-500",
  payout_processed: "bg-emerald-600",
  payout_rejected: "bg-red-500",
  admin_new_dispute: "bg-rose-600",
  admin_new_payout: "bg-emerald-600",
  admin_new_reviewer: "bg-blue-500",
};

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export default function NotificationBell({
  role = "reviewer",
  align = "right",
}: {
  role?: "reviewer" | "admin";
  align?: "left" | "right";
}) {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    latestToast,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    subscribeToSocket,
    clearLatestToast,
  } = useNotificationStore();

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time WebSocket alerts and load initial notifications
  useEffect(() => {
    fetchNotifications();
    const unsubscribe = subscribeToSocket();
    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show live toast for 5 seconds when received
  useEffect(() => {
    if (!latestToast) return;
    const timer = setTimeout(() => {
      clearLatestToast();
    }, 5000);
    return () => clearTimeout(timer);
  }, [latestToast, clearLatestToast]);

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

    if (role === "admin") {
      if (notification.type === "admin_new_dispute") {
        router.push("/admin/disputes");
      } else if (notification.type === "admin_new_payout") {
        router.push("/admin/payouts");
      } else if (notification.type === "admin_new_reviewer") {
        router.push("/admin/reviewers");
      } else {
        router.push("/admin/dashboard");
      }
    } else {
      // Reviewer routes
      if (
        notification.type === "payout_processed" ||
        notification.type === "payout_rejected"
      ) {
        router.push("/dashboard/wallet");
      } else if (notification.bookingId) {
        router.push("/dashboard/bookings");
      }
    }
  };

  const handleBellClick = () => {
    setOpen((v) => !v);

    if (unreadCount > 0) {
      markAllAsRead();
    }
  };

  return (
    <>
      {/* Live Toast Pop-up when a notification arrives via WebSocket */}
      {latestToast && (
        <div
          onClick={() => {
            handleNotificationClick(latestToast);
            clearLatestToast();
          }}
          className="fixed bottom-5 right-5 z-50 flex max-w-sm cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl transition-all duration-300 hover:scale-[1.02] dark:border-slate-800 dark:bg-slate-900"
        >
          <span
            className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT_COLOR[latestToast.type] || "bg-primary"}`}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              {latestToast.title}
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
              {latestToast.message}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearLatestToast();
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bell Dropdown in Navigation / Sidebar */}
      <div ref={panelRef} className="relative">
        <button
          type="button"
          onClick={handleBellClick}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <BellIcon />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div
            className={`absolute ${
              align === "right" ? "right-0" : "left-0"
            } top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200/90 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-100 dark:border-slate-800 dark:bg-slate-900`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Notifications
              </h4>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-semibold text-[#003366] hover:underline dark:text-blue-400"
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
                    className={`flex w-full items-start gap-2.5 border-b border-slate-50 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-800/60 ${
                      n.isRead ? "" : "bg-blue-50/40 dark:bg-blue-950/20"
                    }`}
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT_COLOR[n.type] || "bg-primary"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {n.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                        {n.message}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {dayjs(n.createdAt).fromNow()}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}