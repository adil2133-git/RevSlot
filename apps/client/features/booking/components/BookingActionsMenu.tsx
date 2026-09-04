"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVerticalIcon, EyeIcon, XCircleIcon, RotateIcon, MessageSquareIcon } from "./icons";
import type { MyBooking } from "../type";

interface BookingActionsMenuProps {
  booking: MyBooking;
  onViewDetails: () => void;
  onCancel: () => void;
  onReschedule: () => void;
  onLeaveFeedback?: () => void;
}

export default function BookingActionsMenu({
  booking,
  onViewDetails,
  onCancel,
  onReschedule,
  onLeaveFeedback,
}: BookingActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const canModify = booking.status === "confirmed" || booking.status === "rescheduled";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-2 text-slate-400 hover:bg-surface-hover hover:text-on-surface"
        aria-label="More options"
      >
        <MoreVerticalIcon />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-slate-100 bg-surface-card py-1 shadow-raised">
          <button
            onClick={() => {
              setOpen(false);
              onViewDetails();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-hover"
          >
            <EyeIcon />
            View Details
          </button>

          {booking.status === "completed" && onLeaveFeedback && (
            <button
              onClick={() => {
                setOpen(false);
                onLeaveFeedback();
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-hover"
            >
              <MessageSquareIcon />
              Leave Feedback
            </button>
          )}

          {canModify && (
            <>
              <button
                onClick={() => {
                  setOpen(false);
                  onReschedule();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-hover"
              >
                <RotateIcon />
                Reschedule
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  onCancel();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-error hover:bg-error-container"
              >
                <XCircleIcon />
                Cancel Booking
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}