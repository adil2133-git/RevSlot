"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, ArrowRight, X, Loader2, Calendar } from "lucide-react";
import type { AvailabilityTemplate } from "../types";
import type { EventType } from "@/features/eventTypes/types";

interface DeleteAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  template: AvailabilityTemplate | null;
  linkedEventTypes: EventType[];
  fallbackTemplate: AvailabilityTemplate | null;
  isOnlyTemplate: boolean;
}

export default function DeleteAvailabilityModal({
  isOpen,
  onClose,
  onConfirm,
  template,
  linkedEventTypes,
  fallbackTemplate,
  isOnlyTemplate,
}: DeleteAvailabilityModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !template) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
      setIsDeleting(false);
      onClose();
    } catch (err: any) {
      setIsDeleting(false);
      setError(err?.message || "Failed to delete schedule");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                isOnlyTemplate
                  ? "bg-amber-50 text-amber-600 border border-amber-200/60"
                  : "bg-red-50 text-red-600 border border-red-200/60"
              }`}
            >
              {isOnlyTemplate ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">
                {isOnlyTemplate
                  ? "Cannot Delete Schedule"
                  : `Delete "${template.name}"?`}
              </h2>
              <p className="text-xs text-slate-500">
                {isOnlyTemplate
                  ? "At least one schedule is required"
                  : template.isDefault
                  ? "Default availability schedule"
                  : "Custom availability schedule"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* State 1: Only Schedule Left */}
        {isOnlyTemplate ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-3.5 text-xs text-amber-900 leading-relaxed">
              <p className="font-semibold mb-1">
                You must have at least one availability schedule.
              </p>
              <p className="text-amber-800">
                RevSlot needs your working hours so clients can see open time slots
                and book meetings with you. To replace this schedule, create a new
                one first before deleting <strong>"{template.name}"</strong>.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        ) : linkedEventTypes.length > 0 ? (
          /* State 2: Has Linked Event Types */
          <div className="space-y-4">
            {/* List of Affected Event Types */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Currently Assigned To ({linkedEventTypes.length})
              </span>
              <div className="mt-1.5 max-h-32 overflow-y-auto space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
                {linkedEventTypes.map((et) => (
                  <div
                    key={et.id}
                    className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-white px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  >
                    <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{et.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reassignment Explanation */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-900 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-blue-950 mb-1">
                <ArrowRight className="h-3.5 w-3.5 text-blue-600" />
                Automatic Reassignment
              </div>
              <p className="text-blue-800">
                Deleting this schedule will automatically move{" "}
                {linkedEventTypes.length === 1
                  ? "this event type"
                  : "these event types"}{" "}
                to your default schedule:{" "}
                <strong className="text-blue-950">
                  "{fallbackTemplate?.name || "Default Schedule"}"
                </strong>
                . Your booking links will stay live and uninterrupted.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isDeleting}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Reassigning & Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    Move & Delete
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* State 3: Clean Delete (No linked event types) */
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong>"{template.name}"</strong>?
              This schedule is not linked to any event types. This action cannot be
              undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isDeleting}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Schedule
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
