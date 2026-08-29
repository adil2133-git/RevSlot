"use client";

import { useState } from "react";
import Modal from "@/components/common/Modal";
import dayjs from "dayjs";
import {
  WarningIcon,
  CloseIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  MailIcon,
  GraduationCapIcon,
} from "./icons";
import type { AffectedBooking } from "../api/vacationApi";

interface AffectedBookingsDialogProps {
  affectedBookings: AffectedBooking[];
  reason: string;
  onCancel: () => void;
  onConfirm: () => void;
  submitting: boolean;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AffectedBookingsDialog({
  affectedBookings,
  reason,
  onCancel,
  onConfirm,
  submitting,
}: AffectedBookingsDialogProps) {
  const [view, setView] = useState<"summary" | "detail">("summary");

  if (view === "detail") {
    return (
      <Modal onClose={onCancel} widthClassName="max-w-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div className="flex items-start gap-3">
            <button
              onClick={() => setView("summary")}
              className="mt-1 rounded-lg p-1 text-slate-400 hover:bg-surface-hover hover:text-on-surface"
              aria-label="Back to summary"
            >
              <ArrowLeftIcon />
            </button>
            <div>
              <h2 className="text-xl font-bold text-on-surface">
                Affected Bookings ({affectedBookings.length})
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Review the appointments impacted by this schedule change.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-1 text-slate-400 hover:bg-surface-hover hover:text-on-surface"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="max-h-96 space-y-3 overflow-y-auto p-6">
          {affectedBookings.map((booking) => (
            <div
              key={booking.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-on-secondary">
                  {initials(booking.internName)}
                </div>
                <div>
                  <p className="font-semibold text-on-surface">{booking.internName}</p>
                  <div className="mt-1 flex items-center gap-1 text-sm text-slate-400">
                    <MailIcon />
                    <span>{booking.advisorEmail}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-sm text-error">
                    <span>{dayjs(booking.startTime).format("MMM D · h:mm A")}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-on-primary">
                  {booking.eventTypeName}
                </span>
                <div className="flex items-center gap-1 text-sm text-slate-400">
                  <GraduationCapIcon />
                  <span>Batch {booking.batch}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 p-6">
          <button
            onClick={() => setView("summary")}
            className="rounded-lg px-5 py-2.5 font-semibold text-slate-400 hover:bg-surface-hover"
          >
            Back to Summary
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Processing..." : "Continue"}
            <ArrowRightIcon />
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onCancel} widthClassName="max-w-lg">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-error-container text-error">
            <WarningIcon />
          </div>
          <div>
            <h2 className="text-lg font-bold text-on-surface">
              This vacation block will affect{" "}
              <span className="text-error">{affectedBookings.length}</span> booking(s)
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              The selected date range overlaps with existing scheduled reviews. Continuing
              will cancel those specific bookings.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border-l-4 border-error bg-surface-hover p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Affected advisors will see:
          </p>
          <p className="mt-1 italic text-on-surface">
            "{reason || "Reviewer is unavailable during this period"}"
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 p-6">
        <button
          onClick={onCancel}
          className="rounded-lg px-5 py-2.5 font-semibold text-slate-400 hover:bg-surface-hover"
        >
          Cancel
        </button>
        <button
          onClick={() => setView("detail")}
          className="rounded-lg bg-secondary px-5 py-2.5 font-semibold text-on-secondary transition hover:opacity-90"
        >
          Review
        </button>
        <button
          onClick={onConfirm}
          disabled={submitting}
          className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Processing..." : "Continue"}
        </button>
      </div>
    </Modal>
  );
}