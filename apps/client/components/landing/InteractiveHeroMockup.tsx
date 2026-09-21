"use client";

import React, { useState } from "react";
import {
  Clock,
  Video,
  Globe,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Check,
  Sparkles,
  Lock,
  ArrowRight,
  User,
} from "lucide-react";
import BookingDemoModal from "./BookingDemoModal";

interface DayOption {
  dayName: string;
  dayNum: string;
  fullDate: string;
  slots: string[];
}

const DAYS_DATA: DayOption[] = [
  {
    dayName: "Wed",
    dayNum: "28",
    fullDate: "Wednesday, October 28, 2026",
    slots: ["09:30 AM", "11:00 AM", "02:30 PM", "04:00 PM"],
  },
  {
    dayName: "Thu",
    dayNum: "29",
    fullDate: "Thursday, October 29, 2026",
    slots: ["10:00 AM", "11:30 AM", "02:00 PM", "03:30 PM"],
  },
  {
    dayName: "Fri",
    dayNum: "30",
    fullDate: "Friday, October 30, 2026",
    slots: ["09:00 AM", "10:30 AM", "01:30 PM", "03:00 PM"],
  },
  {
    dayName: "Sat",
    dayNum: "31",
    fullDate: "Saturday, October 31, 2026",
    slots: ["10:00 AM", "11:30 AM", "01:00 PM"],
  },
];

export default function InteractiveHeroMockup() {
  const [selectedDayIndex, setSelectedDayIndex] = useState(1); // Default to Thu 29
  const [selectedSlot, setSelectedSlot] = useState("11:30 AM");
  const [candidateName, setCandidateName] = useState("Alex Rivera");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timezone, setTimezone] = useState("America/New_York (EST)");

  const currentDay = DAYS_DATA[selectedDayIndex];

  const handlePrevDay = () => {
    if (selectedDayIndex > 0) {
      setSelectedDayIndex(selectedDayIndex - 1);
      setSelectedSlot(DAYS_DATA[selectedDayIndex - 1].slots[0]);
    }
  };

  const handleNextDay = () => {
    if (selectedDayIndex < DAYS_DATA.length - 1) {
      setSelectedDayIndex(selectedDayIndex + 1);
      setSelectedSlot(DAYS_DATA[selectedDayIndex + 1].slots[0]);
    }
  };

  const handleDaySelect = (index: number) => {
    setSelectedDayIndex(index);
    if (!DAYS_DATA[index].slots.includes(selectedSlot)) {
      setSelectedSlot(DAYS_DATA[index].slots[0]);
    }
  };

  return (
    <>
      <div className="relative mx-auto w-full max-w-5xl">
        {/* Ambient Glow behind the card */}
        <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-blue-600/20 via-primary/20 to-sky-400/20 opacity-70 blur-xl transition-all duration-500 group-hover:opacity-100 -z-10" />

        {/* Browser Mockup Window */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/10 transition-all duration-300">
          {/* Top Browser Bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-200/80 bg-slate-50/90 px-4 py-3 gap-2">
            {/* Window control buttons */}
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-400/90 inline-block" />
              <span className="h-3 w-3 rounded-full bg-amber-400/90 inline-block" />
              <span className="h-3 w-3 rounded-full bg-emerald-400/90 inline-block" />
            </div>

            {/* URL bar */}
            <div className="flex flex-1 max-w-md items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 font-mono shadow-xs mx-auto">
              <Lock className="mr-1.5 h-3 w-3 text-slate-400" />
              <span className="text-slate-400">revslot.com/</span>
              <span className="font-semibold text-slate-800">sarah-jenkins/senior-capstone-defense</span>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-full px-2.5 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active Slot: Defense Day</span>
            </div>
          </div>

          {/* Main Card Content */}
          <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Left Column: Reviewer Info & Description */}
            <div className="p-6 md:p-8 md:col-span-5 flex flex-col justify-between bg-slate-50/30">
              <div>
                {/* Reviewer Header */}
                <div className="flex items-center gap-3.5 mb-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white font-bold text-base shadow-sm">
                    SJ
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      Dr. Sarah Jenkins
                    </h3>
                    <p className="text-xs font-medium text-slate-500">
                      Dept. of Computer Science & AI
                    </p>
                  </div>
                </div>

                {/* Event Name */}
                <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-2">
                  Senior Capstone Defense
                </h2>

                {/* Event Description */}
                <p className="text-xs leading-relaxed text-slate-600 mb-6">
                  Formal evaluation session for senior research projects. Artifact review, architecture walkthrough, and viva critique.
                </p>

                {/* Metadata List */}
                <div className="space-y-2.5 text-xs text-slate-700 mb-6">
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium">45 Minutes duration</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Video className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium">Google Meet link generated</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Globe className="h-4 w-4 text-primary shrink-0" />
                    <button
                      onClick={() =>
                        setTimezone(
                          timezone.includes("EST")
                            ? "America/Los_Angeles (PST)"
                            : timezone.includes("PST")
                            ? "Asia/Kolkata (IST)"
                            : "America/New_York (EST)"
                        )
                      }
                      title="Click to toggle demo timezone"
                      className="font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      <span>{timezone}</span>
                      <span className="text-[10px] text-slate-400 font-normal">(switch)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Candidate Name Input Box */}
              <div className="mt-4 pt-4 border-t border-slate-200/80">
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Interactive Candidate Simulation
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="Enter student name (e.g. Alex Rivera)"
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Booking Slot Selector */}
            <div className="p-6 md:p-8 md:col-span-7 flex flex-col justify-between bg-white">
              <div>
                {/* Date Navigator Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Select Day — October 2026
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrevDay}
                      disabled={selectedDayIndex === 0}
                      className="p-1 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      aria-label="Previous day"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleNextDay}
                      disabled={selectedDayIndex === DAYS_DATA.length - 1}
                      className="p-1 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      aria-label="Next day"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Day Selector Buttons */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {DAYS_DATA.map((day, idx) => {
                    const isSelected = selectedDayIndex === idx;
                    return (
                      <button
                        key={day.dayNum}
                        onClick={() => handleDaySelect(idx)}
                        className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all ${
                          isSelected
                            ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60"
                        }`}
                      >
                        <span className={`text-[11px] font-medium ${isSelected ? "text-blue-100" : "text-slate-500"}`}>
                          {day.dayName}
                        </span>
                        <span className="text-base font-bold">{day.dayNum}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Available Slots Grid */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-700">
                      Available Slots for {currentDay.dayName} {currentDay.dayNum}:
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">EST Zone</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {currentDay.slots.map((slot) => {
                      const isSelected = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                            isSelected
                              ? "bg-slate-900 text-white shadow-sm ring-2 ring-slate-900 ring-offset-1"
                              : "bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <span>{slot}</span>
                          <span className={`text-[10px] font-normal ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                            {isSelected ? "Selected" : "45 min"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Ready to Confirm Bar */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      Ready to Confirm: Senior Defense
                    </p>
                    <p className="text-[11px] text-slate-600 truncate">
                      {currentDay.dayName} Oct {currentDay.dayNum}, {selectedSlot} • {candidateName || "Candidate"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full sm:w-auto shrink-0 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary/95 transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5"
                >
                  <span>Lock in this review slot</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Booking Confirmation Dialog */}
      <BookingDemoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={`${currentDay.fullDate}`}
        selectedTime={selectedSlot}
        candidateName={candidateName}
      />
    </>
  );
}
