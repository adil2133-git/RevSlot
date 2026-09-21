"use client";

import { useEffect, useRef } from "react";

import { Video, Maximize2, Minimize2 } from "lucide-react";

import type { MeetingParticipant } from "../types/meeting.types";

type RemoteVideoProps = {
  participant: MeetingParticipant;
  stream: MediaStream | null;
  compact?: boolean;
  pinned?: boolean;
  muted?: boolean;
  onTogglePin?: () => void;
};

export default function RemoteVideo({
  participant,
  stream,
  compact = false,
  pinned = false,
  muted = false,
  onTogglePin,
}: RemoteVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.srcObject = stream;

    if (stream) {
      void video.play().catch(() => {
        // Browser autoplay restriction.
      });
    }

    return () => {
      if (video.srcObject === stream) {
        video.srcObject = null;
      }
    };
  }, [stream]);

  return (
    <div
      className={
        compact
          ? "relative h-full w-44 shrink-0 overflow-hidden rounded-xl bg-black sm:w-56 lg:h-36 lg:w-full"
          : "relative min-h-55 overflow-hidden rounded-xl bg-black"
      }
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="h-full w-full object-cover"
      />

      {onTogglePin && (
        <button
          type="button"
          onClick={onTogglePin}
          className="absolute right-3 top-3 z-10 rounded-md bg-black/60 p-2 text-white transition hover:bg-black/80"
          aria-label={pinned ? "Exit expanded view" : "Expand"}
          title={pinned ? "Exit expanded view" : "Expand"}
        >
          {pinned ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      )}

      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500">
          <Video size={40} />
        </div>
      )}

      <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-xs font-semibold">
        {participant.name}
      </span>
    </div>
  );
}