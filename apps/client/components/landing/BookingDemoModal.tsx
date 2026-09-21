"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Video, Calendar, Clock, User, X, Sparkles, ExternalLink, ShieldCheck } from "lucide-react";

interface BookingDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  selectedTime: string;
  candidateName: string;
}

export default function BookingDemoModal({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  candidateName,
}: BookingDemoModalProps) {
  const [copied, setCopied] = useState(false);
  const effectiveName = candidateName.trim() || "Alex Rivera";
  const meetId = "rev-eval-9482";
  const meetUrl = `https://meet.google.com/${meetId}`;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white p-6 md:p-8 shadow-2xl border border-slate-100 z-10 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Success Header Icon */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        {/* Title */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Instant Slot Locked
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">
            Review Session Confirmed!
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Automated calendar invitation and secure Meet room have been provisioned.
          </p>
        </div>

        {/* Session Details Card */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4.5 space-y-3.5 text-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Event</span>
            <span className="font-semibold text-slate-900">Senior Capstone Defense</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Date</span>
            </div>
            <span className="font-medium text-slate-900">{selectedDate}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="h-4 w-4 text-primary" />
              <span>Time Slot</span>
            </div>
            <span className="font-medium text-slate-900">{selectedTime} (45 min)</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600">
              <User className="h-4 w-4 text-primary" />
              <span>Candidate</span>
            </div>
            <span className="font-medium text-slate-900">{effectiveName}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Reviewer</span>
            </div>
            <span className="font-medium text-slate-900">Dr. Sarah Jenkins</span>
          </div>
        </div>

        {/* Google Meet Link Box */}
        <div className="mt-4 rounded-xl bg-primary/5 border border-primary/15 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                <Video className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-primary uppercase tracking-wide">Google Meet Room</p>
                <p className="text-xs font-mono text-slate-700 truncate">{meetUrl}</p>
              </div>
            </div>
            <button
              onClick={handleCopyLink}
              className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-xs border border-primary/20 hover:bg-slate-50 transition-colors"
            >
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-2"
          >
            Done • Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
