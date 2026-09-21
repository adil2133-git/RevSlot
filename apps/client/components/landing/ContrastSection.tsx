"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Video,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Zap,
} from "lucide-react";
import BookingDemoModal from "./BookingDemoModal";

export default function ContrastSection() {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(1);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const slots = [
    { day: "Wed Oct 28", time: "11:30 AM" },
    { day: "Thu Oct 29", time: "02:15 PM" },
  ];

  return (
    <>
      <section id="contrast" className="relative py-24 bg-surface border-t border-slate-200/70 overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-100/40 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="container-page">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block rounded-full bg-blue-50 border border-blue-200/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary mb-3.5">
              Contrast
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Stop the messaging chaos.
            </h2>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">
              Reviewers organize critical reviews through endless back-and-forth message threads across email, Slack, and WhatsApp.
            </p>
          </div>

          {/* 2 Comparison Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* The Old Way Card */}
            <div className="rounded-2xl border border-rose-200/80 bg-white p-6 sm:p-8 shadow-lg shadow-rose-900/5 flex flex-col justify-between relative overflow-hidden">
              {/* Subtle top red accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-rose-400" />

              <div>
                {/* Header Badge Row */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <span className="text-xs font-bold tracking-wide text-rose-600 uppercase">
                      The Old Way
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    Total time: 4 days to lock 1 slot
                  </span>
                </div>

                {/* Card Title */}
                <h3 className="text-lg font-bold text-slate-900 mb-6">
                  Messy chat threads & spreadsheet reconciliation
                </h3>

                {/* Simulated Chat Message Stream */}
                <div className="space-y-3 bg-slate-50/80 rounded-xl p-4 border border-slate-200/60 mb-6 text-xs">
                  {/* Message 1 */}
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] text-slate-400 font-medium mb-0.5">Reviewer • 09:15 AM</span>
                    <div className="bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm px-3.5 py-2 max-w-[85%] shadow-xs">
                      Hi final year team, when is everyone free for the Capstone Review on Friday?
                    </div>
                  </div>

                  {/* Message 2 */}
                  <div className="flex flex-col items-end ml-auto">
                    <span className="text-[10px] text-slate-400 font-medium mb-0.5">Intern 1 • 09:42 AM</span>
                    <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-3.5 py-2 max-w-[85%] shadow-xs">
                      Friday 2pm works for me and Team Alpha!
                    </div>
                  </div>

                  {/* Message 3 */}
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] text-slate-400 font-medium mb-0.5">Intern 2 • 01:20 PM</span>
                    <div className="bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm px-3.5 py-2 max-w-[85%] shadow-xs">
                      Wait, our group has OS Lab until 4pm. Can we do Monday morning instead?
                    </div>
                  </div>

                  {/* Message 4 */}
                  <div className="flex flex-col items-end ml-auto">
                    <span className="text-[10px] text-slate-400 font-medium mb-0.5">Intern 3 • 04:15 PM</span>
                    <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-3.5 py-2 max-w-[85%] shadow-xs">
                      Monday overlaps with ML Viva. Can we do Sunday at 10 AM?
                    </div>
                  </div>

                  {/* Message 5 */}
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] text-slate-400 font-medium mb-0.5">Reviewer • Next day 08:30 AM</span>
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl rounded-tl-sm px-3.5 py-2 max-w-[90%] shadow-xs font-medium">
                      This is taking too long. Fill out this Google Sheet and I'll manually sort it...
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Result Pill */}
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200/80 px-3.5 py-2.5 text-xs font-semibold text-rose-700">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>Result: 30% no-show rate, confusion on team link, lost slots</span>
              </div>
            </div>

            {/* The RevSlot Way Card */}
            <div className="rounded-2xl border border-blue-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-blue-900/5 flex flex-col justify-between relative overflow-hidden">
              {/* Top blue accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

              <div>
                {/* Header Badge Row */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    <span className="text-xs font-bold tracking-wide text-primary uppercase">
                      The RevSlot Way
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-primary bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full">
                    Total time: 1 click • &lt; 30 seconds
                  </span>
                </div>

                {/* Card Title */}
                <h3 className="text-lg font-bold text-slate-900 mb-6">
                  One permanent link. One-click instant booking.
                </h3>

                {/* Interactive Instant Booking Box */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 mb-6">
                  {/* Event mini header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Capstone & Milestone Reviews
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Evaluation session with Google Meet link
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                      Direct single-click
                    </span>
                  </div>

                  {/* Slot selector row */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {slots.map((slot, idx) => {
                      const isSelected = selectedSlotIndex === idx;
                      return (
                        <button
                          key={slot.time}
                          onClick={() => setSelectedSlotIndex(idx)}
                          className={`p-2.5 rounded-lg text-left transition-all ${
                            isSelected
                              ? "bg-primary text-white shadow-sm font-semibold"
                              : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <p className={`text-[10px] ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                            {slot.day}
                          </p>
                          <p className="text-xs font-bold">{slot.time}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Instant Action Button */}
                  <button
                    onClick={() => setIsDemoOpen(true)}
                    className="w-full rounded-lg bg-primary py-2 px-3 text-xs font-bold text-white shadow-sm hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Join Slot</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Value Checkpoints */}
                <ul className="space-y-2.5 text-xs text-slate-700 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Immediate Calendar Invitation with auto-generated secure Google Meet link</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Automated SMS / email reminders 24 hours &amp; 1 hour prior</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Real-time slot reservation locks with zero double-booking</span>
                  </li>
                </ul>
              </div>

              {/* Bottom Result Pill */}
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200/80 px-3.5 py-2.5 text-xs font-semibold text-emerald-700">
                <Zap className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Fast, predictable, &amp; automated</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Modal on Join Slot click */}
      <BookingDemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        selectedDate={slots[selectedSlotIndex].day + ", 2026"}
        selectedTime={slots[selectedSlotIndex].time}
        candidateName="Demo Candidate"
      />
    </>
  );
}
