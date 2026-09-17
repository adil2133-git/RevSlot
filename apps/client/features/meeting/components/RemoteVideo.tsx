"use client";

import {
  useEffect,
  useRef,
} from "react";

import { Video, Maximize2 } from "lucide-react";

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
  const containerRef =
    useRef<HTMLDivElement | null>(null);

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

    const handleFullscreen = async () => {
    const video = videoRef.current;
    const container = containerRef.current;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      if (video?.requestFullscreen) {
        await video.requestFullscreen();
      } else if (container) {
        await container.requestFullscreen();
      }
    } catch {
      // Fullscreen not supported or permission denied.
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

      const recoverFromStall = () => {
      // Only react if THIS video was the one that entered/exited
      // fullscreen — not some other participant's tile.
      const isThisVideoInvolved =
        document.fullscreenElement === video ||
        document.fullscreenElement === null;

      if (!isThisVideoInvolved) return;

      const currentStream = video.srcObject;
      if (!currentStream) return;

      video.srcObject = null;
      requestAnimationFrame(() => {
        video.srcObject = currentStream;
        void video.play().catch(() => {
          // Browser autoplay restriction.
        });
      });
    };

    document.addEventListener("fullscreenchange", recoverFromStall);
    return () => {
      document.removeEventListener("fullscreenchange", recoverFromStall);
    };
  }, []);

  return (
   <div
      ref={containerRef}
      className="relative min-h-55 overflow-hidden rounded-xl bg-black"
      >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="h-full w-full object-cover"
      />

      <button
        type="button"
        onClick={() => void handleFullscreen()}
        className="absolute right-3 top-3 z-10 rounded-md bg-black/60 p-2 text-white transition hover:bg-black/80"
        aria-label="Fullscreen"
        title="Fullscreen"
      >
        <Maximize2 size={18} />
      </button>

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
