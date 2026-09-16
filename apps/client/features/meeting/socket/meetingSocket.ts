"use client";

import { io, type Socket } from "socket.io-client";

import type {
  MeetingMessage,
  MeetingParticipant,
  MeetingSignal,
} from "../types/meeting.types";

const SOCKET_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

export type ClientToServerEvents = {
  "meeting:join": (
    payload: { name: string },
    ack: (response: {
      ok: boolean;
      participants?: MeetingParticipant[];
      messages?: MeetingMessage[];
      maxParticipants?: number;
      error?: string;
    }) => void
  ) => void;
  "meeting:leave": (
    payload: { participantId: string },
    ack?: (response: { ok: boolean }) => void
  ) => void;
  "meeting:heartbeat": (
    payload: { participantId: string },
    ack?: (response: { ok: boolean }) => void
  ) => void;
  "webrtc:signal": (
    payload: {
      to: string;
      type: MeetingSignal["type"];
      payload: unknown;
    },
    ack?: (response: { ok: boolean; error?: string }) => void
  ) => void;
  "chat:send": (
    payload: { message: string },
    ack?: (response: { ok: boolean; error?: string }) => void
  ) => void;
};

export type ServerToClientEvents = {
  "participant:joined": (participant: MeetingParticipant) => void;
  "participant:left": (payload: { participantId: string }) => void;
  "webrtc:signal": (signal: MeetingSignal) => void;
  "chat:message": (message: MeetingMessage) => void;
  "meeting:error": (payload: { message: string }) => void;
};

export type MeetingSocket = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;

export const createMeetingSocket = ({
  bookingId,
  token,
  participantId,
}: {
  bookingId: number;
  token: string;
  participantId: string;
}) => {
  return io(SOCKET_URL, {
    autoConnect: true,
    transports: ["websocket", "polling"],
    auth: {
      bookingId,
      token,
      participantId,
    },
  });
};
