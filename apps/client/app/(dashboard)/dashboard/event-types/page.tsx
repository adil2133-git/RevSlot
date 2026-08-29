"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useEventTypeStore } from "@/features/eventTypes/store/eventType.store";
import EventTypeCard from "@/features/eventTypes/components/EventTypeCard";
import EventTypeStats from "@/features/eventTypes/components/EventTypeStats";

type StatusFilter = "all" | "active" | "inactive";

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export default function EventTypesPage() {
  const router = useRouter();
  const { eventTypes, isLoading, error, loadEventTypes, toggleActive, togglePublic } = useEventTypeStore();
  // Defensive fallback — guards against a stale/undefined store value
  // (e.g. leftover state from an HMR reload, or an unexpected API shape)
  // so the page never crashes on .filter() even if the store misbehaves.
  const safeEventTypes = eventTypes ?? [];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    loadEventTypes();
  }, [loadEventTypes]);

  const filtered = useMemo(() => {
    return safeEventTypes.filter((et) => {
      if (statusFilter === "active" && !et.isActive) return false;
      if (statusFilter === "inactive" && et.isActive) return false;
      if (search.trim() && !et.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [safeEventTypes, search, statusFilter]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface">Event Types</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage the types of sessions you offer to your event bookers.
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/event-types/new")}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-surface transition-opacity hover:opacity-90"
        >
          <PlusIcon />
          Create Event Type
        </button>
      </div>

      <EventTypeStats eventTypes={safeEventTypes} />

      {error && (
        <p className="mb-4 rounded-lg bg-error-container px-4 py-2 text-sm text-error">{error}</p>
      )}

      {isLoading && safeEventTypes.length === 0 ? (
        <p className="text-sm text-slate-400">Loading event types…</p>
      ) : safeEventTypes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-surface-card p-10 text-center text-sm text-slate-500">
          No event types yet. Create one to start accepting bookings.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-100 bg-surface-card shadow-surface">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon />
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search event types…"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">No event types match your search.</p>
          ) : (
            filtered.map((eventType, index) => (
              <EventTypeCard
                key={eventType.id}
                eventType={eventType}
                index={index}
                onEdit={(id) => router.push(`/dashboard/event-types/${id}/edit`)}
                onToggleActive={toggleActive}
                onTogglePublic={togglePublic}
              />
            ))
          )}

          <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
            Showing {filtered.length} of {safeEventTypes.length} event types
          </p>
        </div>
      )}
    </div>
  );
}