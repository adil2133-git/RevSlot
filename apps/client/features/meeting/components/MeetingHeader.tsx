"use client";

import {
  Check,
  Copy,
} from "lucide-react";

type MeetingHeaderProps = {
  eventTypeName: string;
  participantCount: number;
  copied: boolean;
  onCopy: () => void;
};

export default function MeetingHeader({
  eventTypeName,
  participantCount,
  copied,
  onCopy,
}: MeetingHeaderProps) {
  return (
    <div className="flex items-center justify-between px-2 pb-3">
      <div>
        <p className="font-semibold">
          {eventTypeName}
        </p>

        <p className="text-xs text-slate-400">
          {participantCount} participant
          {participantCount === 1 ? "" : "s"}
        </p>
      </div>

      <button
        type="button"
        onClick={onCopy}
        className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold hover:bg-slate-700"
      >
        {copied ? (
          <Check size={14} />
        ) : (
          <Copy size={14} />
        )}

        {copied
          ? "Copied"
          : "Copy meeting link"}
      </button>
    </div>
  );
}