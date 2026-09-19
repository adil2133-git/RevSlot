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
} from "../types/meeting.types";

const makeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

type GuestSession = {
  participantId: string;
  name: string;
};

const getGuestSessionKey = (bookingId: number) =>
  `revslot:meeting:${bookingId}:guest`;

export const getGuestSession = (
  bookingId: number
): GuestSession | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.sessionStorage.getItem(
  getGuestSessionKey(bookingId)
);

  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored);

    if (
      typeof parsed?.participantId !== "string" ||
      typeof parsed?.name !== "string" ||
      !parsed.name.trim()
    ) {
      return null;
    }

    return {
      participantId: parsed.participantId,
      name: parsed.name.trim(),
    };
  } catch {
    return null;
  }
};

const saveGuestSession = (
  bookingId: number,
  session: GuestSession
) => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
  getGuestSessionKey(bookingId),
  JSON.stringify(session)
);
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
      reject(
        new Error(
          "Unable to connect to the meeting server."
        )
      );
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

export function useMeeting({
  bookingId,
  token,
}: UseMeetingProps) {
  const [info, setInfo] =
    useState<MeetingInfo | null>(null);

  const [name, setName] = useState("");

  const [joined, setJoined] = useState(false);

  const [joining, setJoining] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [participants, setParticipants] =
    useState<MeetingParticipant[]>([]);

  const [initialMessages, setInitialMessages] =
    useState<MeetingMessage[]>([]);

  const [socket, setSocket] =
    useState<MeetingSocket | null>(null);

  const socketRef =
    useRef<MeetingSocket | null>(null);

  const participantIdRef = useRef<string | null>(null);

  const setParticipantId = useCallback((id: string | null) => {
    participantIdRef.current = id;
  }, []);

  const joinedRef =
    useRef(false);

  const joiningRef =
    useRef(false);

  const reconnectingRef =
    useRef(false);

  useEffect(() => {
    let cancelled = false;

    setInfo(null);
    setError(null);

    meetingApi
      .getInfo(bookingId, token)
      .then((meetingInfo) => {
        if (!cancelled) {
          setInfo(meetingInfo);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }

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
    const activeSocket =
      socketRef.current;

    if (!activeSocket) {
      return;
    }

    const onParticipantJoined = (
      participant: MeetingParticipant
    ) => {
      setParticipants((current) => {
        const existing = current.some(
          (item) => item.id === participant.id
        );

        if (!existing) {
          return [...current, participant];
        }

        return current.map((item) =>
          item.id === participant.id
            ? participant
            : item
        );
      });
    };

    const onParticipantLeft = ({
      participantId,
    }: {
      participantId: string;
    }) => {
      setParticipants((current) =>
        current.filter(
          (item) => item.id !== participantId
        )
      );
    };

    const onMeetingError = ({
      message,
    }: {
      message: string;
    }) => {
      setError(message);
    };

    activeSocket.on(
      "participant:joined",
      onParticipantJoined
    );

    activeSocket.on(
      "participant:left",
      onParticipantLeft
    );

    activeSocket.on(
      "meeting:error",
      onMeetingError
    );

    return () => {
      activeSocket.off(
        "participant:joined",
        onParticipantJoined
      );

      activeSocket.off(
        "participant:left",
        onParticipantLeft
      );

      activeSocket.off(
        "meeting:error",
        onMeetingError
      );
    };
  }, [socket]);

  const join = useCallback(
    async (nameOverride?: string) => {
      const joinName =
        (nameOverride ?? name).trim();

      if (!joinName) {
        setError(
          "Enter your name before joining."
        );

        return null;
      }

      if (
        joiningRef.current ||
        joinedRef.current
      ) {
        return null;
      }

      joiningRef.current = true;
      setJoining(true);
      setError(null);

      let participantId = participantIdRef.current;

if (!participantId) {
  const guestSession = getGuestSession(bookingId);

  if (guestSession && guestSession.name === joinName) {
    participantId = guestSession.participantId;
  } else {
    participantId = makeId();
  }

  participantIdRef.current = participantId;
}

      
saveGuestSession(bookingId, {
  participantId,
  name: joinName,
});

      const meetingSocket =
        createMeetingSocket({
          bookingId,
          token,
          participantId,
        });

      socketRef.current =
        meetingSocket;

      setSocket(meetingSocket);

      try {
        await waitForSocketConnection(
          meetingSocket
        );

        const result =
          await new Promise<{
            participants: MeetingParticipant[];
            messages: MeetingMessage[];
            maxParticipants: number;
          }>((resolve, reject) => {
            meetingSocket.emit(
              "meeting:join",
              {
                name: joinName,
              },
              (response: {
                  ok: boolean;
                  participants?: MeetingParticipant[];
                  messages?: MeetingMessage[];
                  maxParticipants?: number;
                  error?: string;
                }) => {
              if (!response.ok) {
                  reject(
                    new Error(
                      response.error ??
                        "Could not join the meeting."
                    )
                  );
                  return;
                }

                resolve({
                  participants:
                    response.participants ??
                    [],

                  messages:
                    response.messages ??
                    [],

                  maxParticipants:
                    response.maxParticipants ??
                    8,
                });
              }
            );
          });

        setName(joinName);

        setParticipants(
          result.participants
        );

        setInitialMessages(
          result.messages
        );

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
        joiningRef.current = false;
        setJoining(false);
      }
    },
    [bookingId, token, name]
  );

  const leave = useCallback(
    async () => {
      if (
        !joinedRef.current &&
        !joiningRef.current
      ) {
        return;
      }

      joiningRef.current = false;

      joinedRef.current = false;

      setJoined(false);
      setParticipants([]);
      setInitialMessages([]);
      setJoining(false);

      const activeSocket =
        socketRef.current;

      socketRef.current = null;

      setSocket(null);

      if (!activeSocket) {
        return;
      }

      try {
        await new Promise<void>(
          (resolve) => {
            if (!activeSocket.connected) {
              resolve();
              return;
            }

           const participantId = participantIdRef.current;

if (!participantId) {
  resolve();
  return;
}

activeSocket
  .timeout(2_000)
  .emit(
    "meeting:leave",
    {
      participantId,
    },
    () => resolve()
  );
          }
        );
      } finally {
        activeSocket.disconnect();
      }
    },
    []
  );

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleReconnect = () => {
      if (
        !joinedRef.current ||
        reconnectingRef.current
      ) {
        return;
      }

      reconnectingRef.current = true;

      socket.emit(
        "meeting:join",
        {
          name: name.trim(),
        },
        (response) => {
          reconnectingRef.current =
            false;

          if (!response.ok) {
            setError(
              response.error ??
                "The meeting connection could not be restored."
            );

            return;
          }

          setParticipants(
            response.participants ?? []
          );

          setInitialMessages(
            response.messages ?? []
          );

          setError(null);
        }
      );
    };

    socket.on(
      "connect",
      handleReconnect
    );

    return () => {
      socket.off(
        "connect",
        handleReconnect
      );
    };
  }, [socket, name]);

  useEffect(() => {
    if (!joined || !socket) {
      return;
    }

    const heartbeat = () => {
      if (
        !joinedRef.current ||
        !socket.connected
      ) {
        return;
      }

     const participantId = participantIdRef.current;

if (!participantId) {
  return;
}

socket.emit("meeting:heartbeat", {
  participantId,
});
    };

    heartbeat();

    const timer =
      window.setInterval(
        heartbeat,
        30_000
      );

    return () =>
      window.clearInterval(timer);
  }, [joined, socket]);

  useEffect(() => {
    return () => {
      const activeSocket =
        socketRef.current;

      if (!activeSocket) {
        return;
      }

      socketRef.current = null;

      joinedRef.current = false;

      joiningRef.current = false;

      reconnectingRef.current =
        false;

      activeSocket.disconnect();
    };
  }, [bookingId, token]);

  return {
    info,
    name,
    setName,
    joined,
    joining,
    error,
    setError,
    participants,
    setParticipants,
    initialMessages,
    participantIdRef,
    setParticipantId,
    socket,
    socketRef,
    join,
    leave,
  };
}