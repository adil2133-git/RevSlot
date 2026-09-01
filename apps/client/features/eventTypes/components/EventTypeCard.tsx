"use client";

import { useState, useRef } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { EventType } from "../types";

const ICON_BG = ["bg-secondary text-primary", "bg-emerald-50 text-emerald-600", "bg-violet-50 text-violet-600", "bg-rose-50 text-rose-600"];

const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

const RupeeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a5 5 0 0 0 0-10" />
  </svg>
);

const LinkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.07 0l2.5-2.5a5 5 0 0 0-7.07-7.07L11 4.93" />
    <path d="M14 11a5 5 0 0 0-7.07 0l-2.5 2.5a5 5 0 0 0 7.07 7.07L13 19.07" />
  </svg>
);

const DotsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <circle cx="12" cy="5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

interface EventTypeCardProps {
  eventType: EventType;
  index: number;
  onEdit: (id: number) => void;
  onToggleActive: (id: number, nextIsActive: boolean) => void;
  onTogglePublic: (id: number, nextIsPublic: boolean) => void;
}

export default function EventTypeCard({ eventType, index, onEdit, onToggleActive, onTogglePublic }: EventTypeCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const lastTapRef = useRef<number>(0);
  const iconClass = ICON_BG[index % ICON_BG.length];
  const [copied, setCopied] = useState(false);
  const username = useAuthStore((state) => state.user?.username);

  const handleTouchEnd = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("label")) return;
    const now = Date.now();
    if (now - lastTapRef.current < 350 && now - lastTapRef.current > 0) {
      onEdit(eventType.id);
    }
    lastTapRef.current = now;
  };

  // Works for both public AND hidden event types — isPublic only affects
  // whether it shows up on /username's list, the direct link always works
  // as long as the event type is active (see getBookingPageInfo).
  const handleCopyLink = async () => {
    if (!username || typeof window === "undefined") return;
    const bookingUrl = `${window.location.origin}/${username}/${eventType.slug}`;
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API can fail (no permission / insecure context) — fail
      // quietly rather than throwing in the middle of a click handler.
    }
  };
  return (
    <div
      onDoubleClick={() => onEdit(eventType.id)}
      onTouchEnd={handleTouchEnd}
      className="flex items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0 hover:bg-surface-hover cursor-pointer select-none"
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
        <LinkIcon />
      </div>

      <div className="min-w-0 flex-1">
        <button
          onClick={() => onEdit(eventType.id)}
          className="text-left text-sm font-semibold text-on-surface hover:text-primary hover:underline"
        >
          {eventType.name}
        </button>
        {eventType.description && (
          <p className="mt-0.5 truncate text-xs text-slate-500">{eventType.description}</p>
        )}
        <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <ClockIcon />
            {eventType.durationMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <RupeeIcon />
            {eventType.price > 0 ? `₹${eventType.price}` : "Free"}
          </span>
        </div>
      </div>

      <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
        <span
          className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
            eventType.isActive
              ? "bg-emerald-50 text-emerald-600"
              : "bg-error-container text-error"
          }`}
        >
          {eventType.isActive ? "Active" : "Inactive"}
        </span>
        <span className="text-[11px] text-slate-400">Created on {formatDate(eventType.createdAt)}</span>
      </div>

          {/* Public/hidden toggle — separate from Active. An event can be
          active (reviewer manages it, existing bookings still work) but
          hidden from the public booking page for internal-only sessions. */}
      <label className="hidden shrink-0 flex-col items-center gap-1 text-[11px] text-slate-400 sm:flex">
        <span>{eventType.isPublic ? "Public" : "Hidden"}</span>
        <button
          type="button"
          role="switch"
          aria-checked={eventType.isPublic}
          onClick={() => onTogglePublic(eventType.id, !eventType.isPublic)}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
            eventType.isPublic ? "bg-primary" : "bg-slate-300"
          }`}
        >
        <span
            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              eventType.isPublic ? "translate-x-4" : "translate-x-0"
            }`}
        />
        </button>
      </label>

      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={handleCopyLink}
          disabled={!username}
          title={eventType.isPublic ? "Copy booking link" : "Copy private booking link — not listed publicly"}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? "Copied" : "Copy Link"}
        </button>
        <button
          onClick={() => onEdit(eventType.id)}
          className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-hover"
        >
          Edit
        </button>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-surface-hover hover:text-on-surface"
            aria-label="Event type actions"
          >
            <DotsIcon />
          </button>
          {menuOpen && (
            <div
              onMouseLeave={() => setMenuOpen(false)}
              className="absolute right-0 top-9 z-10 w-40 overflow-hidden rounded-lg border border-slate-100 bg-surface-card shadow-raised"
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onToggleActive(eventType.id, !eventType.isActive);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-hover"
              >
                {eventType.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}