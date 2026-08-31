"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/features/vacation/components/icons";

import dayjs from "dayjs";
import VacationCard from "@/features/vacation/components/VacationCard";
import {
  listVacationBlocks,
  deleteVacationBlock,
  type VacationBlock,
} from "@/features/vacation/api/vacationApi";
import { getVacationStatus } from "@/features/vacation/utils/vacationStatus";

export default function VacationPage() {
  const router = useRouter();

  const [blocks, setBlocks] = useState<VacationBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "past">("all");

  const loadBlocks = async () => {
    try {
      setLoading(true);
      const data = await listVacationBlocks();
      setBlocks(data);
      setError(null);
    } catch {
      setError("Failed to load vacation blocks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlocks();
  }, []);

  const handleDelete = async (block: VacationBlock) => {
    if (
      !confirm(
        "Delete this vacation block? This won't restore any bookings that were already cancelled."
      )
    ) {
      return;
    }
    await deleteVacationBlock(block.id);
    setBlocks((prev) => prev.filter((b) => b.id !== block.id));
  };

  const handleEdit = (block: VacationBlock) => {
    router.push(`/dashboard/vacation/${block.id}/edit`);
  };

  const handleCreate = () => {
    router.push("/dashboard/vacation/new");
  };

  // Local Filter
  const filteredBlocks = blocks.filter((block) => {
    const status = getVacationStatus(block.startDate, block.endDate);
    if (activeTab === "upcoming") {
      return status === "active" || status === "upcoming";
    }
    if (activeTab === "past") {
      return status === "past";
    }
    return true;
  });

  // Calculate live statistics
  const currentYear = dayjs().year();
  let daysOffYTD = 0;
  let upcomingDays = 0;

  blocks.forEach((block) => {
    const start = dayjs(block.startDate);
    const end = dayjs(block.endDate);
    const diff = end.diff(start, "day") + 1;
    
    // YTD (current year)
    if (start.year() === currentYear) {
      daysOffYTD += diff;
    }
    
    // Upcoming / Active
    const status = getVacationStatus(block.startDate, block.endDate);
    if (status === "active" || status === "upcoming") {
      upcomingDays += diff;
    }
  });

  return (
    <div className="container-page py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">Vacation</h1>
          <p className="mt-1 text-sm text-slate-500 leading-relaxed">
            Manage your time off and session availability. During scheduled vacation blocks, all automatic booking slots will be suspended.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-surface transition-all duration-200 hover:bg-primary/95 hover:shadow-raised hover:-translate-y-[1px] active:translate-y-0 shrink-0"
        >
          <PlusIcon />
          New Vacation
        </button>
      </div>

      {loading && <p className="text-slate-400">Loading...</p>}
      {error && <p className="text-error">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Filters and Cards List */}
          <div className="lg:col-span-8 flex flex-col">
            {blocks.length > 0 && (
              <>
                {/* Tabs */}
                <div className="mb-6 flex gap-2">
                  {(["all", "upcoming", "past"] as const).map((tab) => {
                    const isActive = activeTab === tab;
                    const label = tab === "all" ? "All Blocks" : tab === "upcoming" ? "Upcoming" : "Past";
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition-all cursor-pointer ${
                          isActive
                            ? "bg-primary text-on-primary border-primary shadow-surface"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-surface-hover hover:text-on-surface"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {filteredBlocks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
                    No vacation blocks found for this filter.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBlocks.map((block) => (
                      <VacationCard
                        key={block.id}
                        block={block}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {blocks.length === 0 && (
              <div className="py-8">
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-surface max-w-md mx-auto">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-secondary/50 text-primary">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22v-6M12 16a7 7 0 0 0-7-7h14a7 7 0 0 0-7 7z" />
                      <path d="M12 16a7 7 0 0 1-7-7M12 16a7 7 0 0 0 7-7" />
                      <path d="M12 22a2 2 0 0 1-2-2" />
                    </svg>
                  </div>
                  <h2 className="mb-2 text-base font-bold text-on-surface">No time off scheduled</h2>
                  <p className="mb-6 max-w-xs text-xs text-slate-400 leading-relaxed">
                    You'll stay bookable every day until you block out dates.
                  </p>
                  <button
                    onClick={handleCreate}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary shadow-surface transition-all duration-200 hover:bg-primary/95 hover:shadow-raised hover:-translate-y-[1px] active:translate-y-0"
                  >
                    <PlusIcon />
                    New Vacation
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Widgets */}
          <div className="lg:col-span-4 space-y-6">
            {/* Summary Widget */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-surface">
              <div className="mb-4 flex items-center gap-2">
                <svg className="text-primary h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
                <h3 className="text-sm font-bold tracking-tight text-on-surface">Summary</h3>
              </div>

              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between py-3">
                  <span className="text-xs text-slate-500">Days Off YTD</span>
                  <span className="text-sm font-bold text-on-surface">{daysOffYTD}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-xs text-slate-500">Upcoming Days</span>
                  <span className="text-sm font-bold text-on-surface">{upcomingDays}</span>
                </div>
              </div>

              <p className="mt-4 text-[10px] leading-relaxed text-slate-400">
                Note: Scheduling limits depend on your department's specific academic calendar guidelines.
              </p>
            </div>

            {/* Quote Card Widget */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-100 shadow-surface bg-slate-900 aspect-[4/3] flex items-end">
              <img
                src="/desk_calendar_quote_bg.jpg"
                alt="Calendar Desk"
                className="absolute inset-0 h-full w-full object-cover opacity-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-900/10 to-transparent" />
              
              <div className="relative w-full p-4 flex justify-center">
                <div className="w-full rounded-xl bg-white/90 backdrop-blur-md p-3.5 shadow-sm text-center border border-white/20">
                  <p className="text-[11px] font-medium leading-relaxed text-primary italic">
                    "Rest is not idleness, it is the key to clarity."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}