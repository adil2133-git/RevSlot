"use client";

import React, { useState } from "react";
import {
  Clock,
  Copy,
  Check,
  Video,
  FileText,
  Calendar,
  Share2,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export default function WorkflowSection() {
  const [copied, setCopied] = useState(false);
  const shareUrl = "revslot.com/sarah-jenkins/capstone-defense";

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section id="how-it-works" className="py-24 bg-surface border-t border-slate-200/70">
      <div className="container-page">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <span className="inline-block rounded-full bg-blue-50 border border-blue-200/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary mb-3.5">
            Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Three steps from link to locked-in defense.
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Simple setup designed to fit into existing university Google Workspace or Microsoft 365 environments.
          </p>
        </div>

        {/* 3 Step Blocks */}
        <div className="space-y-8 max-w-5xl mx-auto">
          {/* STEP 01 */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Info */}
            <div className="lg:col-span-6">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white font-bold text-xs mb-4">
                01
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2.5">
                Set your availability
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Specify your windows of evaluation. Include automatic 15-minute buffers so consecutive sessions never bleed into one another.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Set Buffer Intervals
                </span>
                <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Auto Timezone Selection
                </span>
              </div>
            </div>

            {/* Right: Visual Widget */}
            <div className="lg:col-span-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                  <span className="font-bold text-slate-900">Standard Review Hours</span>
                  <span className="text-[11px] font-medium text-primary bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full">
                    Eastern Time (ET)
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2">
                    <span className="font-bold text-slate-800 w-12">Mon</span>
                    <span className="text-slate-600 font-mono">09:00 AM - 05:00 PM</span>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">15m buffer</span>
                  </div>
                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2">
                    <span className="font-bold text-slate-800 w-12">Wed</span>
                    <span className="text-slate-600 font-mono">10:00 AM - 04:00 PM</span>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">15m buffer</span>
                  </div>
                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2">
                    <span className="font-bold text-slate-800 w-12">Fri</span>
                    <span className="text-slate-600 font-mono">01:00 PM - 05:00 PM</span>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">15m buffer</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 02 */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Info */}
            <div className="lg:col-span-6">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white font-bold text-xs mb-4">
                02
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2.5">
                Share your link
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Embed your personal URL on Canvas, Blackboard, email signatures, or broadcast it directly to team leads over Slack.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  LMS Friendly
                </span>
                <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Single-Click Copy
                </span>
              </div>
            </div>

            {/* Right: Visual Widget */}
            <div className="lg:col-span-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4.5 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                  <span className="font-bold text-slate-900">Public Link Dispatch</span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Link
                  </span>
                </div>

                <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white p-1.5 shadow-xs">
                  <span className="text-xs font-mono text-slate-700 truncate px-2 flex-1">
                    {shareUrl}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary/95 transition-all flex items-center gap-1"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-300" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 pt-1">
                  <span className="font-semibold text-slate-700">Supported in:</span>
                  <span className="rounded bg-slate-200/70 px-2 py-0.5 text-slate-700 font-medium">Canvas LMS</span>
                  <span className="rounded bg-slate-200/70 px-2 py-0.5 text-slate-700 font-medium">Blackboard</span>
                  <span className="rounded bg-slate-200/70 px-2 py-0.5 text-slate-700 font-medium">Moodle</span>
                  <span className="rounded bg-slate-200/70 px-2 py-0.5 text-slate-700 font-medium">Slack</span>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 03 */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Info */}
            <div className="lg:col-span-6">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white font-bold text-xs mb-4">
                03
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2.5">
                Get booked — automatically
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                When a slot is claimed, both parties receive a calendar event with a secure Meet link and the candidate's documentation attached.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Google Meet Auto-Generated
                </span>
                <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Synced Calendar Invites
                </span>
              </div>
            </div>

            {/* Right: Visual Widget */}
            <div className="lg:col-span-6">
              <div className="rounded-xl border border-blue-200/80 bg-blue-50/30 p-4.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-blue-100 text-xs">
                  <span className="font-bold text-primary">New Booked Review</span>
                  <span className="font-bold text-slate-700">Thu, 11:30 AM</span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900">
                    Viva Event: Lead Dr. Sarah Jenkins
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Autonomous Drone Navigation • Milestone 3
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-white border border-slate-200 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Video className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-mono text-[11px] text-slate-600 truncate">meet.google.com/xyz-eval-rev</span>
                  </div>
                  <span className="text-[10px] font-semibold text-primary">Pre-generated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
