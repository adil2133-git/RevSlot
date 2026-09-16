"use client";

import {
  useEffect,
  useRef,
} from "react";
import type { RefObject } from "react";
import { Video } from "lucide-react";

import type { MeetingParticipant } from "../types/meeting.types";

type RemoteVideoProps = {
  participant: MeetingParticipant;
  stream: MediaStream | null;
};

export default function RemoteVideo({
  participant,
  stream,
}: RemoteVideoProps) {
  const videoRef =
    useRef<HTMLVideoElement | null>(null);

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
    <div className="relative min-h-[220px] overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="h-full w-full object-cover"
      />

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
