"use client";

import type { ReactNode } from "react";
import {
  Camera,
  CameraOff,
  ListChecks,
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
  chatUnreadCount?: number;
  showQuestionBank?: boolean;
  questionBankOpen?: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onShareScreen: () => void;
  onToggleChat: () => void;
  onToggleQuestionBank?: () => void;
  onLeave: () => void;
};

export default function MeetingControls({
  muted,
  cameraOff,
  sharing,
  shareDisabled,
  chatOpen,
  chatUnreadCount = 0,
  showQuestionBank,
  questionBankOpen,
  onToggleMic,
  onToggleCamera,
  onShareScreen,
  onToggleChat,
  onToggleQuestionBank,
  onLeave,
}: MeetingControlsProps) {
  return (
    <div className="mt-3 flex items-center justify-center gap-2">
      {/* MIC */}
      <ControlButton
        danger={!muted}
        active={!muted}
        onClick={onToggleMic}
        label={muted ? "Unmute" : "Mute"}
      >
        {muted ? <MicOff /> : <Mic />}
      </ControlButton>

      {/* CAMERA */}
      <ControlButton
        danger={!cameraOff}
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

      {/* SCREEN SHARE */}
      <ControlButton
        danger={sharing}
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

      {/* CHAT */}
      <ControlButton
        danger={chatOpen}
        active={chatOpen}
        onClick={onToggleChat}
        label={
          chatUnreadCount > 0
            ? `Chat (${chatUnreadCount} new message${
                chatUnreadCount > 1
                  ? "s"
                  : ""
              })`
            : "Chat"
        }
      >
        <span className="relative inline-flex">
          <span className="text-sm font-bold">
            💬
          </span>

          {!chatOpen &&
            chatUnreadCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-slate-900 bg-blue-500 px-1 text-[10px] font-bold leading-none text-white">
                {chatUnreadCount > 9
                  ? "9+"
                  : chatUnreadCount}
              </span>
            )}
        </span>
      </ControlButton>

      {/* QUESTION BANK */}
      {showQuestionBank && (
        <ControlButton
          danger={!!questionBankOpen}
          active={!!questionBankOpen}
          onClick={
            onToggleQuestionBank ??
            (() => {})
          }
          label="Question bank"
        >
          <ListChecks />
        </ControlButton>
      )}

      {/* LEAVE */}
      <button
        type="button"
        onClick={onLeave}
        className="ml-3 inline-flex h-11 items-center gap-2 rounded-full bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-500"
      >
        <LogOut size={17} />
        Leave
      </button>
    </div>
  );
}

function ControlButton({
  active,
  danger,
  disabled,
  onClick,
  label,
  children,
}: {
  active: boolean;
  danger: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition ${
        disabled
          ? "cursor-not-allowed bg-slate-700 opacity-40"
          : danger
            ? "bg-red-600 hover:bg-red-500"
            : active
              ? "bg-slate-700 hover:bg-slate-600"
              : "bg-slate-700 hover:bg-slate-600"
      }`}
    >
      {children}
    </button>
  );
}