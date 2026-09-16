"use client";

import { Video } from "lucide-react";

import type {
  MeetingInfo,
  MeetingRole,
} from "../types/meeting.types";

type JoinMeetingProps = {
  info: MeetingInfo;
  name: string;
  role: MeetingRole;
  joining: boolean;
  error: string | null;
  setName: (value: string) => void;
  setRole: (value: MeetingRole) => void;
  onJoin: () => void;
};

export default function JoinMeeting({
  info,
  name,
  role,
  joining,
  error,
  setName,
  setRole,
  onJoin,
}: JoinMeetingProps) {
  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">
              RevSlot Meeting
            </p>

            <h1 className="mt-1 text-xl font-bold text-slate-900">
              {info.eventTypeName}
            </h1>
          </div>

          <Video className="text-primary" />
        </div>

        <p className="mb-6 text-sm text-slate-500">
          Hosted by {info.reviewerName}
        </p>

        <label className="block text-sm font-semibold text-slate-700">
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
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
          placeholder="Enter your name"
        />

        <label className="mt-4 block text-sm font-semibold text-slate-700">
          Participant type
        </label>

        <select
          value={role}
          onChange={(event) =>
            setRole(
              event.target.value as MeetingRole
            )
          }
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
        >
          <option value="guest">Guest</option>
          <option value="advisor">Advisor</option>
          <option value="intern">Intern</option>
          <option value="reviewer">Reviewer</option>
        </select>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={joining}
          onClick={onJoin}
          className="mt-6 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-on-primary disabled:opacity-50"
        >
          {joining ? "Joining…" : "Join meeting"}
        </button>

        <p className="mt-4 text-center text-xs text-slate-400">
          Camera and microphone permission are required for the video call.
        </p>
      </div>
    </main>
  );
}
