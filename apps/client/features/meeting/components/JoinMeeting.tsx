"use client";

import type { RefObject } from "react";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Video,
} from "lucide-react";

import type { MeetingInfo } from "../types/meeting.types";

type JoinMeetingProps = {
  info: MeetingInfo;
  name: string;
  joining: boolean;
  error: string | null;

  localVideoRef: RefObject<HTMLVideoElement | null>;

  muted: boolean;
  cameraOff: boolean;
  mediaReady: boolean;
  preparingMedia: boolean;

  showNameInput: boolean;

  setName: (value: string) => void;

  onToggleMic: () => void;
  onToggleCamera: () => void;
  onJoin: () => void;
};

export default function JoinMeeting({
  info,
  name,
  joining,
  error,
  localVideoRef,
  muted,
  cameraOff,
  mediaReady,
  preparingMedia,
  showNameInput,
  setName,
  onToggleMic,
  onToggleCamera,
  onJoin,
}: JoinMeetingProps) {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-128px)] max-w-5xl items-center">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-slate-900 shadow-2xl lg:grid-cols-[1.35fr_1fr]">
          {/* LEFT - CAMERA PREVIEW */}
          <section className="flex flex-col p-5 sm:p-7">
            <div className="mb-5">
              <p className="text-sm font-semibold text-primary">
                RevSlot Meeting
              </p>

              <h1 className="mt-1 text-xl font-semibold">
                {info.eventTypeName}
              </h1>
            </div>

           <div className="relative min-h-[300px] flex-1 overflow-hidden rounded-2xl bg-black">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={`h-full min-h-[300px] w-full object-cover ${
                  cameraOff ? "opacity-0" : ""
                }`}
              />

              {cameraOff && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-700">
                    <CameraOff size={34} />
                  </div>

                  <p className="mt-4 text-sm text-slate-300">
                    Camera is off
                  </p>
                </div>
              )}

              {preparingMedia && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    <p className="mt-3 text-sm text-slate-200">
                      Preparing your camera...
                    </p>
                  </div>
                </div>
              )}

              {!preparingMedia && mediaReady && (
                <div className="absolute bottom-4 left-4 rounded-lg bg-black/60 px-3 py-2 text-sm font-medium">
                  {name || "You"}
                </div>
              )}

              {/* CAMERA / MIC CONTROLS */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  type="button"
                  onClick={onToggleMic}
                  title={muted ? "Turn microphone on" : "Mute microphone"}
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${
                    muted
                      ? "bg-red-600 hover:bg-red-500"
                      : "bg-white/90 text-slate-900 hover:bg-white"
                  }`}
                >
                  {muted ? (
                    <MicOff size={19} />
                  ) : (
                    <Mic size={19} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={onToggleCamera}
                  title={
                    cameraOff
                      ? "Turn camera on"
                      : "Turn camera off"
                  }
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${
                    cameraOff
                      ? "bg-red-600 hover:bg-red-500"
                      : "bg-white/90 text-slate-900 hover:bg-white"
                  }`}
                >
                  {cameraOff ? (
                    <CameraOff size={19} />
                  ) : (
                    <Camera size={19} />
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* RIGHT - JOIN PANEL */}
          <section className="flex flex-col justify-center border-t border-slate-800 bg-slate-950/40 p-6 sm:p-8 lg:border-l lg:border-t-0">
            <div>
              <div className="mb-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Video
                    size={24}
                    className="text-primary"
                  />
                </div>

                <h2 className="text-3xl font-semibold tracking-tight">
                  Ready to join?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Check your camera and microphone before
                  entering the meeting.
                </p>
              </div>

              {/* NAME */}
              {showNameInput ? (
                <div className="mb-5">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Your name
                  </label>

                  <input
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        onJoin();
                      }
                    }}
                    placeholder="Enter your name"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-primary"
                  />
                </div>
              ) : (
                <div className="mb-5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                  <p className="text-xs text-slate-500">
                    Joining as
                  </p>

                  <p className="mt-1 font-medium text-white">
                    {name}
                  </p>
                </div>
              )}

              {/* DEVICE STATUS */}
              <div className="mb-6 space-y-2">
                <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3">
                  <div className="flex items-center gap-3">
                    {muted ? (
                      <MicOff
                        size={18}
                        className="text-red-400"
                      />
                    ) : (
                      <Mic
                        size={18}
                        className="text-green-400"
                      />
                    )}

                    <span className="text-sm">
                      Microphone
                    </span>
                  </div>

                  <span className="text-xs text-slate-400">
                    {muted ? "Off" : "On"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3">
                  <div className="flex items-center gap-3">
                    {cameraOff ? (
                      <CameraOff
                        size={18}
                        className="text-red-400"
                      />
                    ) : (
                      <Camera
                        size={18}
                        className="text-green-400"
                      />
                    )}

                    <span className="text-sm">
                      Camera
                    </span>
                  </div>

                  <span className="text-xs text-slate-400">
                    {cameraOff ? "Off" : "On"}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mb-5 rounded-xl border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="button"
                disabled={
                  joining ||
                  preparingMedia ||
                  !mediaReady ||
                  !name.trim()
                }
                onClick={onJoin}
                className="w-full rounded-xl bg-primary px-5 py-3.5 font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {joining
                  ? "Joining meeting..."
                  : preparingMedia
                    ? "Preparing camera..."
                    : "Join Meeting"}
              </button>

              <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                Your camera and microphone will be used for
                this meeting.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}