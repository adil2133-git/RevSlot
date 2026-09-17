"use client";

import React, { useState } from "react";
import { Phone, X, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/authStore";

interface WhatsappRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

const PHONE_REGEX = /^\+?[0-9\s-]{10,15}$/;

export default function WhatsappRequiredModal({
  isOpen,
  onClose,
  onSuccess,
  title = "Add your WhatsApp Number",
  description = "A WhatsApp number is required before creating availability schedules or event types. Bookers and advisors use this as a fallback if you're not on Meet.",
}: WhatsappRequiredModalProps) {
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = whatsappNumber.trim();

    if (!cleanNumber) {
      setError("WhatsApp number cannot be empty.");
      return;
    }

    if (!PHONE_REGEX.test(cleanNumber)) {
      setError("Please enter a valid phone number (10–15 digits, optional +).");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateProfile({ whatsappNumber: cleanNumber });
      setSaving(false);
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : "Failed to save WhatsApp number");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl transition-all"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <Phone className="h-5 w-5" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500 leading-relaxed">
            {description}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="whatsappInput" className="block text-xs font-semibold text-slate-700">
              WhatsApp Phone Number
            </label>
            <div className="relative mt-1.5">
              <input
                id="whatsappInput"
                type="tel"
                value={whatsappNumber}
                onChange={(e) => {
                  setWhatsappNumber(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="+91 98765 43210"
                maxLength={18}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-3 focus:ring-primary/20"
                autoFocus
              />
            </div>
            {error && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save & Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
