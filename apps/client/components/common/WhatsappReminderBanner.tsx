"use client";

import React, { useState } from "react";
import { Phone } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/authStore";
import WhatsappRequiredModal from "./WhatsappRequiredModal";

export default function WhatsappReminderBanner() {
  const user = useAuthStore((state) => state.user);
  const [modalOpen, setModalOpen] = useState(false);

  // Only show for reviewers who don't have a whatsappNumber
  if (!user || user.role !== "reviewer" || user.whatsappNumber) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 shadow-xs transition-all">
        <div className="flex items-start gap-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <Phone className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-900">
              Action Required: Add your WhatsApp Number
            </h3>
            <p className="mt-0.5 text-xs text-amber-800 leading-relaxed">
              Please add your WhatsApp number to create availability schedules and event types. It is used as a fallback if you or bookers don&apos;t show up on Meet.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="shrink-0 rounded-xl bg-amber-800 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-900 transition"
        >
          Add WhatsApp Number
        </button>
      </div>

      <WhatsappRequiredModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
