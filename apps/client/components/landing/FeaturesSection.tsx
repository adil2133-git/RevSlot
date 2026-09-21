"use client";

import React, { useState } from "react";
import {
  CalendarClock,
  Layers,
  CalendarOff,
  ClipboardCheck,
  FolderKanban,
  ShieldCheck,
  ArrowUpRight,
  CheckCircle,
} from "lucide-react";

interface FeatureItem {
  id: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  badge: string;
  highlights: string[];
}

const FEATURES: FeatureItem[] = [
  {
    id: "templates",
    icon: CalendarClock,
    title: "Availability Templates",
    desc: "Set recurring default templates with configurable buffer intervals, early-cutoff thresholds, and maximum daily limits.",
    badge: "Configurable Buffer Intervals",
    highlights: [
      "Zero back-to-back fatigue with auto 15-min buffers",
      "Per-day maximum booking caps",
      "Timezone-aware slot generation",
    ],
  },
  {
    id: "events",
    icon: Layers,
    title: "Custom Event Types",
    desc: "Create dedicated links for 15-minute quick checks, 45-minute presentations, or full defenses with distinct prerequisites.",
    badge: "Individual URLs & Custom Limits",
    highlights: [
      "Unique shareable URL per evaluation type",
      "Custom questions & file upload mandates",
      "Automated slot collision prevention across all types",
    ],
  },
  {
    id: "vacation",
    icon: CalendarOff,
    title: "Vacation & Blackout Mode",
    desc: "Halt bookings instantly during final exam grading weeks or conference travel without destroying recurring configurations.",
    badge: "One-click temporary pause",
    highlights: [
      "Freeze dates without deleting recurring schedule",
      "Auto-informs students of blacked-out periods",
      "One-click resumption when back in session",
    ],
  },
  {
    id: "forms",
    icon: ClipboardCheck,
    title: "Custom Feedback Forms",
    desc: "Mandate project repository links, slide decks, and self-assessment criteria upfront right during the booking transaction.",
    badge: "Pre-meeting submission enforcement",
    highlights: [
      "Custom fields (GitHub URLs, Drive links, PPTs)",
      "Standardized rubrics for viva evaluation",
      "Structured candidate remarks history",
    ],
  },
  {
    id: "questions",
    icon: FolderKanban,
    title: "Structured Question Banks",
    desc: "Pre-screen candidates or outline evaluation criteria directly in the slot details before reviewers step into a defense.",
    badge: "Dynamic scoring rubrics",
    highlights: [
      "Categorized question sets by topic",
      "Quick-access during live review evaluations",
      "Shared team question templates",
    ],
  },
  {
    id: "otp",
    icon: ShieldCheck,
    title: "OTP-Verified Bookings",
    desc: "Private evaluations for verified students & candidates using frictionless single-click email OTP without forced passwords.",
    badge: "Zero password fatigue",
    highlights: [
      "Secure 6-digit email verification",
      "Instant advisor portal access without signup",
      "Spam protection for public links",
    ],
  },
];

export default function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  return (
    <section id="features" className="py-24 bg-white border-t border-slate-200/70">
      <div className="container-page">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <span className="inline-block rounded-full bg-blue-50 border border-blue-200/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary mb-3.5">
            Engineered for Evaluation
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Built for how reviewers actually work.
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Review workflows aren't generic sales calls. They require strict buffers, rigorous member limits, and academic boundaries.
          </p>
        </div>

        {/* 6-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            const isHovered = activeFeature === feat.id;

            return (
              <div
                key={feat.id}
                onMouseEnter={() => setActiveFeature(feat.id)}
                onMouseLeave={() => setActiveFeature(null)}
                className={`rounded-2xl border p-6 sm:p-7 transition-all duration-300 flex flex-col justify-between ${
                  isHovered
                    ? "border-primary/40 bg-slate-50/70 shadow-lg shadow-primary/5 -translate-y-1"
                    : "border-slate-200/80 bg-white hover:border-slate-300 shadow-xs"
                }`}
              >
                <div>
                  {/* Icon Box */}
                  <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-primary ring-4 ring-blue-50/50">
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {feat.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                    {feat.desc}
                  </p>
                </div>

                {/* Bottom Badge Tag */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>{feat.badge}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
