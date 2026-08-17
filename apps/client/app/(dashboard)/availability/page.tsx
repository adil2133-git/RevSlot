"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAvailabilityStore } from "@/features/availability/store/availability.store";
import AvailabilityCard from "@/features/availability/components/AvailabilityCard";

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export default function AvailabilityPage() {
  const router = useRouter();
  const { templates, isLoading, error, loadTemplates, removeTemplate } = useAvailabilityStore();

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleDelete = (id: number) => {
    if (window.confirm("Delete this availability template? This can't be undone.")) {
      removeTemplate(id);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-on-surface">Availability</h1>
        <button
          onClick={() => router.push("/availability/new")}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-surface transition-opacity hover:opacity-90"
        >
          <PlusIcon />
          New Availability
        </button>
      </div>

      {isLoading && templates.length === 0 && (
        <p className="text-sm text-slate-400">Loading availability…</p>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-error-container px-4 py-2 text-sm text-error">{error}</p>
      )}

      {!isLoading && templates.length === 0 && !error && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-surface-card p-10 text-center text-sm text-slate-500">
          No availability templates yet. Create one to start accepting bookings.
        </div>
      )}

      {templates.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <AvailabilityCard
              key={template.id}
              template={template}
              onEdit={(id) => router.push(`/availability/${id}/edit`)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}