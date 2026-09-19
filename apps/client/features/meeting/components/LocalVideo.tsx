"use client";

import type { RefObject } from "react";
import { CameraOff } from "lucide-react";

type LocalVideoProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  name: string;
  cameraOff: boolean;
};

export default function LocalVideo({
  videoRef,
  name,
  cameraOff,
}: LocalVideoProps) {
  return (
    <div className="relative min-h-[220px] overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="h-full w-full object-cover"
      />

      <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-xs font-semibold">
        {name} (You)
      </span>

      {cameraOff && (
        <span className="absolute inset-0 flex items-center justify-center text-slate-400">
          <CameraOff size={42} />
        </span>
      )}
    </div>
  );
}
