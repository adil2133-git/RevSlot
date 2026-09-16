"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { meetingApi } from "../api/meetingApi";
import {
  createMeetingSocket,
  type MeetingSocket,
} from "../socket/meetingSocket";
import type {
  MeetingInfo,
  MeetingMessage,
  MeetingParticipant,
  MeetingRole,
} from "../types/meeting.types";

const makeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getParticipantId = (bookingId: number) => {
  const key = `revslot-meeting-participant-${bookingId}`;

  if (typeof window === "undefined") {
    return makeId();
  }

  const existing = window.localStorage.getItem(key);

  if (existing) return existing;

  const id = makeId();
  window.localStorage.setItem(key, id);
  return id;
};

type UseMeetingProps = {
  bookingId: number;
  token: string;
};

const waitForSocketConnection = (
  socket: MeetingSocket,
  timeoutMs = 10_000
) =>
  new Promise<void>((resolve, reject) => {
    if (socket.connected) {
      resolve();
      return;
    }

    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("Unable to connect to the meeting server."));
    }, timeoutMs);

    const onConnect = () => {
      cleanup();
      resolve();
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      window.clearTimeout(timer);
      socket.off("connect", onConnect);
      socket.off("connect_error", onError);
    };

    socket.once("connect", onConnect);
    socket.once("connect_error", onError);
  });

export function useMeeting({ bookingId, token }: UseMeetingProps) {
  const [info, setInfo] = useState<MeetingInfo | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState<MeetingRole>("guest");
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [initialMessages, setInitialMessages] = useState<MeetingMessage[]>([]);
  const [socket, setSocket] = useState<MeetingSocket | null>(null);

  const socketRef = useRef<MeetingSocket | null>(null);
  const participantIdRef = useRef(getParticipantId(bookingId));
  const joinedRef = useRef(false);

  useEffect(() => {
    participantIdRef.current = getParticipantId(bookingId);
  }, [bookingId]);

  useEffect(() => {
    let cancelled = false;

    setInfo(null);
    setError(null);

    meetingApi
      .getInfo(bookingId, token)
      .then((meetingInfo) => {
        if (!cancelled) setInfo(meetingInfo);
      })
      .catch((err: unknown) => {
        if (cancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to open this meeting."
        );
      });

    return () => {
      cancelled = true;
    };
  }, [bookingId, token]);

  useEffect(() => {
    joinedRef.current = joined;
  }, [joined]);

  useEffect(() => {
    const activeSocket = socketRef.current;

    if (!activeSocket) return;

    const onParticipantJoined = (participant: MeetingParticipant) => {
      setParticipants((current) => {
        const existing = current.some(
          (item) => item.id === participant.id
        );

        if (!existing) return [...current, participant];

        return current.map((item) =>
          item.id === participant.id ? participant : item
        );
      });
    };

    const onParticipantLeft = ({ participantId }: { participantId: string }) => {
      setParticipants((current) =>
        current.filter((item) => item.id !== participantId)
      );
    };

    const onMeetingError = ({ message }: { message: string }) => {
      setError(message);
    };

    activeSocket.on("participant:joined", onParticipantJoined);
    activeSocket.on("participant:left", onParticipantLeft);
    activeSocket.on("meeting:error", onMeetingError);

    return () => {
      activeSocket.off("participant:joined", onParticipantJoined);
      activeSocket.off("participant:left", onParticipantLeft);
      activeSocket.off("meeting:error", onMeetingError);
    };
  }, [socket]);

  const join = useCallback(
    async (
      nameOverride?: string,
      roleOverride?: MeetingRole
    ) => {
      const joinName = (nameOverride ?? name).trim();
      const joinRole = roleOverride ?? role;

      if (!joinName) {
        setError("Enter your name before joining.");
        return null;
      }

      if (joining || joinedRef.current) {
        return null;
      }

      setJoining(true);
      setError(null);

      const participantId = participantIdRef.current;
      const meetingSocket = createMeetingSocket({
        bookingId,
        token,
        participantId,
      });

      socketRef.current = meetingSocket;
      setSocket(meetingSocket);

      try {
        await waitForSocketConnection(meetingSocket);

        const result = await new Promise<{
          participants: MeetingParticipant[];
          messages: MeetingMessage[];
          maxParticipants: number;
        }>((resolve, reject) => {
           meetingSocket.emit(
  "meeting:join",
  { name: joinName, role: joinRole },
  (response: {
    ok: boolean;
    error?: string;
    participants?: MeetingParticipant[];
    messages?: MeetingMessage[];
    maxParticipants?: number;
  }) => {
    if (!response.ok) {
      reject(
        new Error(
          response.error ?? "Could not join the meeting."
        )
      );
      return;
    }

    resolve({
      participants: response.participants ?? [],
      messages: response.messages ?? [],
      maxParticipants: response.maxParticipants ?? 8,
    });
  }
);
        });

        setName(joinName);
        setRole(joinRole);
        setParticipants(result.participants);
        setInitialMessages(result.messages);

        joinedRef.current = true;
        setJoined(true);

        return result;
      } catch (err: unknown) {
        joinedRef.current = false;
        setJoined(false);
        meetingSocket.disconnect();
        socketRef.current = null;
        setSocket(null);

        setError(
          err instanceof Error
            ? err.message
            : "Could not join the meeting."
        );

        return null;
      } finally {
        setJoining(false);
      }
    },
    [bookingId, token, name, role, joining]
  );

  const leave = useCallback(async () => {
    if (!joinedRef.current) return;

    joinedRef.current = false;
    setJoined(false);
    setParticipants([]);
    setInitialMessages([]);
    setJoining(false);

    const activeSocket = socketRef.current;
    socketRef.current = null;
    setSocket(null);

    if (!activeSocket) return;

    try {
      await new Promise<void>((resolve) => {
        if (!activeSocket.connected) {
          resolve();
          return;
        }

        activeSocket.timeout(2_000).emit(
          "meeting:leave",
          { participantId: participantIdRef.current },
          () => resolve()
        );
      });
    } finally {
      activeSocket.disconnect();
    }
  }, []);

  useEffect(() => {
    if (!joined || !socket) return;

    const heartbeat = () => {
      if (!joinedRef.current || !socket.connected) return;

      socket.emit("meeting:heartbeat", {
        participantId: participantIdRef.current,
      });
    };

    heartbeat();

    const timer = window.setInterval(heartbeat, 30_000);

    return () => window.clearInterval(timer);
  }, [joined, socket]);

  useEffect(() => {
    return () => {
      const activeSocket = socketRef.current;

      if (!activeSocket) return;

      socketRef.current = null;
      joinedRef.current = false;
      activeSocket.disconnect();
    };
  }, [bookingId, token]);

  return {
    info,
    name,
    setName,
    role,
    setRole,
    joined,
    joining,
    error,
    setError,
    participants,
    setParticipants,
    initialMessages,
    participantIdRef,
    socket,
    socketRef,
    join,
    leave,
  };
}
