"use client";

import { useState } from "react";
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

interface EventTypeCardProps {
  eventType: EventType;
  index: number;
  onEdit: (id: number) => void;
  onToggleActive: (id: number, nextIsActive: boolean) => void;
}

export default function EventTypeCard({ eventType, index, onEdit, onToggleActive }: EventTypeCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const iconClass = ICON_BG[index % ICON_BG.length];

  return (
    <div className="flex items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0 hover:bg-surface-hover">
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

      <div className="flex shrink-0 items-center gap-2">
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