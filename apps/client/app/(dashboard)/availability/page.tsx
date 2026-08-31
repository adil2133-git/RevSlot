"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { useAvailabilityStore } from "@/features/availability/store/availability.store";
import { useAuthStore } from "@/features/auth/store/authStore";

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

function formatTime12(timeStr: string) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hours = parseInt(h ?? "0", 10);
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const padHours = String(displayHours).padStart(2, "0");
  const padMins = String(m ?? "00").padStart(2, "0");
  return `${padHours}:${padMins} ${ampm}`;
}

export default function AvailabilityPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { templates, isLoading, error, loadTemplates, removeTemplate } = useAvailabilityStore();
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // UI Interactive States
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

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

  // 1. Calculate stats
  const totalTemplates = templates.length;
  
  const activeDaysSet = new Set<number>();
  templates.forEach((t) => {
    t.timeBlocks?.forEach((tb) => {
      activeDaysSet.add(tb.dayOfWeek);
    });
  });
  const activeDaysCount = activeDaysSet.size;

  let totalWeeklyHours = 0;
  templates.forEach((t) => {
    t.timeBlocks?.forEach((tb) => {
      const start = dayjs(`2026-08-31T${tb.startTime}`);
      const end = dayjs(`2026-08-31T${tb.endTime}`);
      const diff = end.diff(start, "hour", true);
      if (diff > 0) {
        totalWeeklyHours += diff;
      }
    });
  });

  // 2. Weekly timeline segments helper
  const getDayTimelineSegments = (dayNum: number) => {
    const segments: { left: number; width: number }[] = [];
    templates.forEach((t) => {
      t.timeBlocks?.forEach((tb) => {
        if (tb.dayOfWeek === dayNum) {
          const startParts = tb.startTime.split(":");
          const endParts = tb.endTime.split(":");
          const startHour = parseInt(startParts[0] ?? "0", 10) + parseInt(startParts[1] ?? "0", 10) / 60;
          const endHour = parseInt(endParts[0] ?? "0", 10) + parseInt(endParts[1] ?? "0", 10) / 60;
          
          const left = (startHour / 24) * 100;
          const width = ((endHour - startHour) / 24) * 100;
          segments.push({ left, width });
        }
      });
    });
    return segments;
  };

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col overflow-hidden max-w-6xl mx-auto py-2">
      {/* Username Required Alert */}
      {(!user?.username || usernameError) && (
        <div className="mb-4 rounded-xl border border-error-container bg-error-container/40 p-3.5 text-xs text-error shrink-0">
          <div className="flex items-center gap-2 font-semibold">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Username Required
          </div>
          <p className="mt-1 leading-normal">
            Username is required before setting availability. Please set your username first in your profile.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4 shrink-0">
        <div>
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">Availability</h1>
          <p className="text-sm text-slate-500">Manage your schedule templates and working hours.</p>
        </div>
        <button
          onClick={handleNewAvailability}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-surface transition-all duration-200 hover:bg-primary/95 hover:shadow-raised hover:-translate-y-[1px] active:translate-y-0 shrink-0"
        >
          <PlusIcon />
          New Availability
        </button>
      </div>

      {isLoading && templates.length === 0 && (
        <p className="text-slate-400">Loading availability…</p>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-error-container px-4 py-2 text-sm text-error shrink-0">{error}</p>
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 flex-1 overflow-hidden">
          
          {/* Left Column: Stats & Templates Grid */}
          <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
            {templates.length > 0 && (
              <>
                {/* Stats Row */}
                <div className="mb-5 grid grid-cols-3 gap-4 shrink-0">
                  <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-surface flex flex-col justify-center h-22">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Total Templates</span>
                    <span className="text-2xl font-black text-on-surface leading-none">{totalTemplates}</span>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-surface flex flex-col justify-center h-22">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Active Days/Week</span>
                    <span className="text-2xl font-black text-on-surface leading-none">{activeDaysCount} {activeDaysCount === 1 ? "day" : "days"}</span>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-surface flex flex-col justify-center h-22">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Weekly Hours Available</span>
                    <span className="text-2xl font-black text-on-surface leading-none">{totalWeeklyHours} {totalWeeklyHours === 1 ? "hr" : "hrs"}</span>
                  </div>
                </div>

                {/* Templates Scroll Grid */}
                <div className="flex-1 overflow-y-auto pr-1 pb-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {templates.map((template) => {
                      const firstBlock = template.timeBlocks?.[0];
                      const formattedTime = firstBlock 
                        ? `${formatTime12(firstBlock.startTime)} – ${formatTime12(firstBlock.endTime)}`
                        : "No hours set";
                      
                      const activeDays = new Set(template.timeBlocks?.map((tb) => tb.dayOfWeek));
                      const daysOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon to Sun
                      const dayLabels: Record<number, string> = {
                        1: "M", 2: "T", 3: "W", 4: "T", 5: "F", 6: "S", 0: "S"
                      };

                      return (
                        <div
                          key={template.id}
                          className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-surface hover:shadow-raised transition-all duration-200"
                        >
                          <div>
                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-3 gap-2">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <h3 className="text-sm font-bold text-on-surface tracking-tight">
                                  {template.name}
                                </h3>
                                {template.isDefault && (
                                  <span className="rounded bg-[#e6eef5] text-[#003366] px-1.5 py-0.5 text-[9px] font-bold tracking-wide">
                                    DEFAULT
                                  </span>
                                )}
                              </div>

                              {/* Dropdown Menu */}
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpenId(menuOpenId === template.id ? null : template.id);
                                  }}
                                  className="rounded-lg p-1 text-slate-400 hover:bg-surface-hover hover:text-on-surface transition-all cursor-pointer"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="1" />
                                    <circle cx="12" cy="5" r="1" />
                                    <circle cx="12" cy="19" r="1" />
                                  </svg>
                                </button>
                                {menuOpenId === template.id && (
                                  <>
                                    <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); }} />
                                    <div className="absolute right-0 top-7 z-20 w-32 rounded-xl border border-slate-100 bg-white py-1 shadow-raised">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setMenuOpenId(null);
                                          router.push(`/availability/${template.id}/edit`);
                                        }}
                                        className="flex w-full items-center px-4 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-surface-hover"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setMenuOpenId(null);
                                          handleDelete(template.id);
                                        }}
                                        className="flex w-full items-center px-4 py-2 text-left text-xs font-semibold text-error hover:bg-error-container/40"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Hours Display */}
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 font-medium">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              <span>{formattedTime}</span>
                            </div>
                          </div>

                          {/* Days Grid Indicator */}
                          <div className="flex items-center gap-1.5">
                            {daysOrder.map((day) => {
                              const isDayActive = activeDays.has(day);
                              return (
                                <div
                                  key={day}
                                  className={`flex h-7.5 w-7.5 items-center justify-center rounded-full text-[10px] font-bold transition-all border ${
                                    isDayActive
                                      ? "bg-[#003366] text-white border-[#003366] shadow-sm"
                                      : "bg-slate-50 text-slate-300 border-slate-100"
                                  }`}
                                >
                                  {dayLabels[day]}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Empty State Redesign (One Page View) */}
            {templates.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4 flex-1">
                <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-[0_4px_12px_rgba(0,51,102,0.06)]">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                      <circle cx="16" cy="16" r="4.5" fill="white" stroke="var(--color-primary)" strokeWidth="2.2" />
                      <path d="M16 14.5v1.5l1 1" />
                    </svg>
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </div>
                </div>

                <h2 className="mb-2 text-center text-lg font-bold tracking-tight text-on-surface sm:text-xl">
                  Set up your availability
                </h2>
                <p className="mb-5 max-w-sm text-center text-[12px] leading-relaxed text-slate-500 sm:text-[13px]">
                  Define your working hours and session blocks so advisors can find time with you. You can create multiple templates for different schedules.
                </p>

                <button
                  onClick={handleNewAvailability}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary shadow-surface transition-all duration-200 hover:bg-primary/95 hover:shadow-raised hover:-translate-y-[1px] active:translate-y-0"
                >
                  <PlusIcon />
                  New Availability
                </button>

                <div className="my-6 w-full max-w-sm border-t border-slate-100" />

                <div className="w-full max-w-md">
                  <h3 className="mb-4 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Getting Started
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">
                        1
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 sm:text-[11px]">Create a template</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">
                        2
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 sm:text-[11px]">Define your hours</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">
                        3
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 sm:text-[11px]">Go live</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Weekly Coverage Summary */}
          <div className="lg:col-span-4 shrink-0 flex flex-col h-full justify-start">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-surface flex flex-col">
              <h3 className="text-sm font-bold tracking-tight text-on-surface mb-5">
                Weekly Coverage
              </h3>

              {/* Coverage Timeline Row for each Day */}
              <div className="space-y-4">
                {([
                  { num: 1, label: "MON" },
                  { num: 2, label: "TUE" },
                  { num: 3, label: "WED" },
                  { num: 4, label: "THU" },
                  { num: 5, label: "FRI" },
                  { num: 6, label: "SAT" },
                  { num: 0, label: "SUN" }
                ]).map((day) => {
                  const segments = getDayTimelineSegments(day.num);
                  return (
                    <div key={day.num} className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-slate-400 w-8 tracking-wider shrink-0">{day.label}</span>
                      
                      {/* Timeline Track */}
                      <div className="relative flex-1 bg-secondary h-4 rounded-full overflow-hidden shadow-inner">
                        {segments.map((seg, i) => (
                          <div
                            key={i}
                            className="absolute h-full bg-primary rounded-full"
                            style={{
                              left: `${seg.left}%`,
                              width: `${seg.width}%`
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Note Subtext */}
              <p className="mt-5 text-[10px] leading-relaxed text-slate-400 border-t border-slate-100 pt-4">
                Visual representation of your combined availability across all active templates.
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}