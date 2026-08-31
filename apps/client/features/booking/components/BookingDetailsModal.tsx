"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/common/Modal";
import { XIcon, MailIcon, CalendarIcon, ClockIcon, ExternalLinkIcon } from "./icons";
import StatusBadge from "./StatusBadge";
import { formatBookingDate, formatBookingTimeRange } from "../utils/bookingDisplay";
import { fetchBookingById } from "../api/bookingApi";
import type { BookingDetail } from "../type";

interface BookingDetailsModalProps {
  bookingId: number;
  onClose: () => void;
}

export default function BookingDetailsModal({ bookingId, onClose }: BookingDetailsModalProps) {
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookingById(bookingId)
      .then(setDetail)
      .catch(() => setError("Failed to load booking details."))
      .finally(() => setLoading(false));
  }, [bookingId]);

  return (
    <Modal onClose={onClose} widthClassName="max-w-lg">
      <div className="flex items-center justify-between border-b border-slate-100 p-6">
        <h2 className="text-xl font-bold text-on-surface">Booking Details</h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-surface-hover hover:text-on-surface"
          aria-label="Close"
        >
          <XIcon />
        </button>
      </div>

      <div className="p-6">
        {loading && <p className="text-slate-400">Loading...</p>}
        {error && <p className="text-error">{error}</p>}

        {detail && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-on-surface">{detail.eventTypeName}</p>
              <StatusBadge status={detail.status} />
            </div>

            <div className="flex items-center gap-2 text-sm text-on-surface">
              <CalendarIcon />
              <span>{formatBookingDate(detail.startTime)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <ClockIcon />
              <span>{formatBookingTimeRange(detail.startTime, detail.endTime)}</span>
            </div>

            <div className="rounded-xl border border-slate-100 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Advisor</p>
              <p className="font-medium text-on-surface">{detail.advisorName}</p>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                <MailIcon />
                <span>{detail.advisorEmail}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Intern</p>
              <p className="font-medium text-on-surface">{detail.internName}</p>
              <p className="mt-1 text-sm text-slate-400">Batch {detail.batch}</p>
              <p className="mt-1 text-sm text-slate-400">{detail.weekStage}</p>
              {detail.internEmails && detail.internEmails.length > 0 && (
                <div className="mt-2 space-y-1">
                  {detail.internEmails.map((email) => (
                    <div key={email} className="flex items-center gap-2 text-sm text-slate-400">
                      <MailIcon />
                      <span>{email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {detail.meetLink && (
            <a 
                href={detail.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-on-primary transition hover:opacity-90"
              >
                Join Meet
                <ExternalLinkIcon />
              </a>
            )}

            {detail.status === "cancelled" && detail.cancelledReason && (
              <div className="rounded-xl border-l-4 border-error bg-error-container p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-error">Cancelled</p>
                <p className="mt-1 text-sm text-on-surface">{detail.cancelledReason}</p>
                {detail.cancelledAt && (
                  <p className="mt-1 text-xs text-slate-400">
                    {formatBookingDate(detail.cancelledAt)}
                  </p>
                )}
              </div>
            )}

            {detail.status === "rescheduled" && (
              <div className="rounded-xl border-l-4 border-amber-500 bg-amber-50 p-4 text-amber-900">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Rescheduled Session</p>
                <p className="mt-1 text-sm">This booking has been rescheduled to the date and time shown above.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}