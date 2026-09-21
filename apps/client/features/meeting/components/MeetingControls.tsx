"use client";

import type { ReactNode } from "react";
import {
  Camera,
  CameraOff,
  LogOut,
  Mic,
  MicOff,
  MonitorUp,
} from "lucide-react";

type MeetingControlsProps = {
  muted: boolean;
  cameraOff: boolean;
  sharing: boolean;
  shareDisabled?: boolean;
  chatOpen: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onShareScreen: () => void;
  onToggleChat: () => void;
  onLeave: () => void;
};

export default function MeetingControls({
  muted,
  cameraOff,
  sharing,
  shareDisabled,
  chatOpen,
  onToggleMic,
  onToggleCamera,
  onShareScreen,
  onToggleChat,
  onLeave,
}: MeetingControlsProps) {
  return (
    <div className="mt-3 flex items-center justify-center gap-2">
      <ControlButton
        active={!muted}
        onClick={onToggleMic}
        label={muted ? "Unmute" : "Mute"}
      >
        {muted ? <MicOff /> : <Mic />}
      </ControlButton>

      <ControlButton
        active={!cameraOff}
        onClick={onToggleCamera}
        label={
          cameraOff
            ? "Turn camera on"
            : "Turn camera off"
        }
      >
        {cameraOff ? (
          <CameraOff />
        ) : (
          <Camera />
        )}
      </ControlButton>

      <ControlButton
        active={sharing}
        disabled={shareDisabled}
        onClick={onShareScreen}
        label={
          shareDisabled
            ? "Someone else is presenting"
            : sharing
              ? "Stop sharing"
              : "Share screen"
        }
      >
        <MonitorUp />
      </ControlButton>

      <ControlButton
        active={chatOpen}
        onClick={onToggleChat}
        label="Chat"
      >
        <span className="text-sm font-bold">
          💬
        </span>
      </ControlButton>

      <button
        type="button"
        onClick={onLeave}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-red-600 px-5 text-sm font-semibold hover:bg-red-500"
      >
        <LogOut size={17} />
        Leave
      </button>
    </div>
  );
}

function ControlButton({
  active,
  disabled,
  onClick,
  label,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${
        disabled
          ? "cursor-not-allowed bg-slate-800 opacity-40"
          : active
            ? "bg-slate-800 hover:bg-slate-700"
            : "bg-red-600 hover:bg-red-500"
      }`}
    >
      {children}
    </button>
  );
}
