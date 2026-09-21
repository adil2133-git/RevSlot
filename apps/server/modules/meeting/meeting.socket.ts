import { Server, type Socket } from "socket.io";
import { z } from "zod";

import { meetingService } from "./meeting.service.js";
import {
  ChatMessageSchema,
  JoinMeetingSchema,
  SignalSchema,
} from "./meeting.validation.js";

const SocketAuthSchema = z.object({
  bookingId: z.coerce.number().int().positive(),
  token: z.string().min(16),
  participantId: z.string().min(1).max(100),
});

const LeaveSchema = z.object({
  participantId: z.string().min(1).max(100),
});

const HeartbeatSchema = z.object({
  participantId: z.string().min(1).max(100),
});

const ScreenStartSchema = z.object({
  streamId: z.string().min(1).max(200),
});

type MeetingSocketData = {
  bookingId: number;
  token: string;
  participantId: string;
};

type MeetingSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  MeetingSocketData
>;

export type ClientToServerEvents = {
  "meeting:join": (
    payload: {
      name: string;
    },
    ack: (response: MeetingJoinAck) => void
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
      type: "offer" | "answer" | "ice-candidate";
      payload: unknown;
    },
    ack?: (response: { ok: boolean; error?: string }) => void
  ) => void;
  "webrtc:ready": () => void;
  "screen:start": (
    payload: { streamId: string },
    ack: (response: { ok: boolean; error?: string }) => void
  ) => void;
  "screen:stop": () => void;
  "chat:send": (
    payload: { message: string },
    ack?: (response: { ok: boolean; error?: string }) => void
  ) => void;
};

export type ServerToClientEvents = {
  "participant:joined": (
    participant: MeetingParticipant
  ) => void;
  "participant:left": (
    payload: { participantId: string }
  ) => void;
  "webrtc:signal": (
    signal: MeetingSignal
  ) => void;
  "participant:ready": (payload: { participantId: string }) => void;
  "screen:state": (state: ScreenShareState | null) => void;
  "chat:message": (
    message: MeetingMessage
  ) => void;
  "meeting:error": (
    payload: { message: string }
  ) => void;
};

type MeetingParticipant = {
  id: string;
  name: string;
  lastSeen: number;
};

type ScreenShareState = {
  participantId: string;
  streamId: string;
};

type MeetingMessage = {
  id: number;
  participantId: string;
  name: string;
  message: string;
  createdAt: number;
};

type MeetingSignal = {
  id: number;
  from: string;
  to: string;
  type: "offer" | "answer" | "ice-candidate";
  payload: unknown;
  createdAt: number;
};

type MeetingJoinAck = {
  ok: boolean;
  participants?: MeetingParticipant[];
  messages?: MeetingMessage[];
  maxParticipants?: number;
  error?: string;
};

const socketParticipants = new Map<
  number,
  Map<string, string>
>();

/*
 * One active screen presenter per meeting.
 * Kept in memory, like socketParticipants above.
 */
const activeScreenShares = new Map<
  number,
  ScreenShareState & { socketId: string }
>();

const toPublicScreenState = (
  bookingId: number
): ScreenShareState | null => {
  const share = activeScreenShares.get(bookingId);

  return share
    ? {
        participantId: share.participantId,
        streamId: share.streamId,
      }
    : null;
};

const getParticipantSockets = (bookingId: number) => {
  let map = socketParticipants.get(bookingId);

  if (!map) {
    map = new Map();
    socketParticipants.set(bookingId, map);
  }

  return map;
};

const getSocketForParticipant = (
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  bookingId: number,
  participantId: string
) => {
  const socketId = socketParticipants
    .get(bookingId)
    ?.get(participantId);

  if (!socketId) return null;

  return io.sockets.sockets.get(socketId) as MeetingSocket | undefined;
};

const removeSocketMapping = (
  bookingId: number,
  participantId: string,
  socketId: string
) => {
  const map = socketParticipants.get(bookingId);

  if (!map || map.get(participantId) !== socketId) {
    return;
  }

  map.delete(participantId);

  if (map.size === 0) {
    socketParticipants.delete(bookingId);
  }
};

const roomName = (bookingId: number) =>
  `meeting:${bookingId}`;

export const registerMeetingSocket = (
  io: Server<ClientToServerEvents, ServerToClientEvents>
) => {
  io.use(async (socket, next) => {
    try {
      const auth = SocketAuthSchema.parse(socket.handshake.auth);
      await meetingService.validateAccess(
        auth.bookingId,
        auth.token
      );

      socket.data = auth;
      next();
    } catch (error) {
      next(
        new Error(
          error instanceof Error
            ? error.message
            : "Unable to authorize meeting socket."
        )
      );
    }
  });

  io.on("connection", (socket) => {
    const meetingSocket = socket as MeetingSocket;
    const { bookingId, token, participantId } =
      meetingSocket.data;

    meetingSocket.join(roomName(bookingId));

    meetingSocket.on("meeting:join", async (payload, ack) => {
      try {
        const input = JoinMeetingSchema.parse({
          token,
          participantId,
          name: payload.name,
        });

        const existingSocket = getSocketForParticipant(
          io,
          bookingId,
          participantId
        );

        if (
          existingSocket &&
          existingSocket.id !== meetingSocket.id
        ) {
          existingSocket.emit("meeting:error", {
            message:
              "This participant joined from another meeting window.",
          });

          existingSocket.disconnect(true);
        }

        const result = await meetingService.join(
          bookingId,
          input.token,
          {
            id: input.participantId,
            name: input.name,
          }
        );

        getParticipantSockets(bookingId).set(
          participantId,
          meetingSocket.id
        );

        ack({
          ok: true,
          participants: result.participants,
          messages: result.messages,
          maxParticipants: result.maxParticipants,
        });

        meetingSocket.to(roomName(bookingId)).emit(
          "participant:joined",
          {
            id: input.participantId,
            name: input.name,
            lastSeen: Date.now(),
          }
        );
      } catch (error) {
        ack({
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Could not join the meeting.",
        });
      }
    });

    meetingSocket.on("meeting:heartbeat", async (payload, ack) => {
      try {
        const input = HeartbeatSchema.parse(payload);

        if (input.participantId !== participantId) {
          throw new Error("Invalid participant identity.");
        }

        await meetingService.heartbeat(
          bookingId,
          token,
          participantId
        );

        ack?.({ ok: true });
      } catch {
        ack?.({ ok: false });
      }
    });

    meetingSocket.on("webrtc:signal", async (payload, ack) => {
      try {
        const input = SignalSchema.parse({
          token,
          from: participantId,
          to: payload.to,
          type: payload.type,
          payload: payload.payload,
        });

        await meetingService.validateParticipantPair(
          bookingId,
          token,
          input.from,
          input.to
        );

        const target = getSocketForParticipant(
          io,
          bookingId,
          input.to
        );

        if (!target) {
          ack?.({ ok: false, error: "Participant is offline." });
          return;
        }

        target.emit("webrtc:signal", {
          id: Date.now(),
          from: input.from,
          to: input.to,
          type: input.type,
          payload: input.payload,
          createdAt: Date.now(),
        });

        ack?.({ ok: true });
      } catch (error) {
        ack?.({
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Unable to send WebRTC signal.",
        });
      }
    });

    meetingSocket.on("webrtc:ready", () => {
      meetingSocket
        .to(roomName(bookingId))
        .emit("participant:ready", { participantId });

      // Late joiners need to know if someone is already presenting.
      meetingSocket.emit(
        "screen:state",
        toPublicScreenState(bookingId)
      );
    });

    /*
     * Screen share ownership.
     * The server only decides WHO may present (one at a time).
     * The screen video itself still travels over WebRTC.
     */
    const clearScreenShareIfOwner = () => {
      const share = activeScreenShares.get(bookingId);

      if (share?.socketId !== meetingSocket.id) {
        return;
      }

      activeScreenShares.delete(bookingId);

      io.to(roomName(bookingId)).emit("screen:state", null);
    };

    meetingSocket.on("screen:start", (payload, ack) => {
      try {
        const input = ScreenStartSchema.parse(payload);

        const joined =
          socketParticipants
            .get(bookingId)
            ?.get(participantId) === meetingSocket.id;

        if (!joined) {
          ack?.({
            ok: false,
            error: "Join the meeting before sharing your screen.",
          });
          return;
        }

        const current = activeScreenShares.get(bookingId);

        if (
          current &&
          current.participantId !== participantId
        ) {
          ack?.({
            ok: false,
            error:
              "Someone else is already presenting. Wait until they stop sharing.",
          });
          return;
        }

        activeScreenShares.set(bookingId, {
          participantId,
          streamId: input.streamId,
          socketId: meetingSocket.id,
        });

        io.to(roomName(bookingId)).emit(
          "screen:state",
          toPublicScreenState(bookingId)
        );

        ack?.({ ok: true });
      } catch {
        ack?.({
          ok: false,
          error: "Unable to start screen sharing.",
        });
      }
    });

    meetingSocket.on("screen:stop", () => {
      clearScreenShareIfOwner();
    });

    meetingSocket.on("chat:send", async (payload, ack) => {
      try {
        const input = ChatMessageSchema.parse({
          token,
          participantId,
          message: payload.message,
        });

        const message = await meetingService.addMessage(
          bookingId,
          input.token,
          input.participantId,
          input.message
        );

        io.to(roomName(bookingId)).emit(
          "chat:message",
          message
        );

        ack?.({ ok: true });
      } catch (error) {
        ack?.({
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Unable to send message.",
        });
      }
    });

    meetingSocket.on("meeting:leave", async (payload, ack) => {
      try {
        const input = LeaveSchema.parse(payload);

        if (input.participantId !== participantId) {
          throw new Error("Invalid participant identity.");
        }

        await meetingService.leave(
          bookingId,
          token,
          participantId
        );

        clearScreenShareIfOwner();

        removeSocketMapping(
          bookingId,
          participantId,
          meetingSocket.id
        );

        meetingSocket.to(roomName(bookingId)).emit(
          "participant:left",
          { participantId }
        );

        ack?.({ ok: true });
      } catch {
        ack?.({ ok: false });
      }
    });

    meetingSocket.on("disconnect", async () => {
      // A presenter who drops (refresh / closed tab) stops presenting.
      clearScreenShareIfOwner();

      const map = socketParticipants.get(bookingId);
      const ownsParticipant =
        map?.get(participantId) === meetingSocket.id;

      if (!ownsParticipant) {
        return;
      }

      removeSocketMapping(
        bookingId,
        participantId,
        meetingSocket.id
      );

      try {
        await meetingService.leave(
          bookingId,
          token,
          participantId
        );
      } catch {
        // Socket disconnect cleanup should never crash the server.
      }

      meetingSocket.to(roomName(bookingId)).emit(
        "participant:left",
        { participantId }
      );
    });
  });
};