"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAvailabilityStore } from "@/features/availability/store/availability.store";
import { useAuthStore } from "@/features/auth/store/authStore";
import AvailabilityCard from "@/features/availability/components/AvailabilityCard";

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export default function AvailabilityPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { templates, isLoading, error, loadTemplates, removeTemplate } = useAvailabilityStore();
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleDelete = (id: number) => {
    if (window.confirm("Delete this availability template? This can't be undone.")) {
      removeTemplate(id);
    }
  };

  const handleNewAvailability = () => {
    if (!user?.username) {
      setUsernameError("Username is required before setting availability. Please set your username first.");
      return;
    }
    router.push("/availability/new");
  };

  return (
    <div>
      {(!user?.username || usernameError) && (
        <div className="mb-6 rounded-xl border border-error-container bg-error-container/40 p-4 text-sm text-error">
          <div className="flex items-center gap-2 font-semibold">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Username Required
          </div>
          <p className="mt-1">
            Username is required before setting availability. Please set your username first in your profile.
          </p>
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-on-surface">Availability</h1>
        <button
          onClick={handleNewAvailability}
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