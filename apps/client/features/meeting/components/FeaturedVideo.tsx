"use client";

import { useEffect, useRef } from "react";

import { Minimize2, MonitorUp } from "lucide-react";

type FeaturedVideoProps = {
  stream: MediaStream | null;
  label: string;
  kind: "screen" | "camera";
  onExit?: () => void;
};

export default function FeaturedVideo({
  stream,
  label,
  kind,
  onExit,
}: FeaturedVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.srcObject = stream;
    video.muted = true;
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
    <div className="relative min-h-[200px] min-w-0 flex-1 overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-contain"
      />

      {!stream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500">
          <MonitorUp size={40} />
          <span className="text-sm">Loading shared screen…</span>
        </div>
      )}

      {onExit && (
        <button
          type="button"
          onClick={onExit}
          className="absolute right-3 top-3 z-10 rounded-md bg-black/60 p-2 text-white transition hover:bg-black/80"
          aria-label="Exit expanded view"
          title="Exit expanded view"
        >
          <Minimize2 size={18} />
        </button>
      )}

      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-xs font-semibold">
        {kind === "screen" && <MonitorUp size={14} />}
        {label}
      </span>
    </div>
  );
}