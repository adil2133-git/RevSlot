"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type { MeetingSocket } from "../socket/meetingSocket";
import type { MeetingMessage } from "../types/meeting.types";

type UseMeetingChatProps = {
  joined: boolean;
  socket: MeetingSocket | null;
  initialMessages: MeetingMessage[];
  setError: (message: string | null) => void;
};

export function useMeetingChat({
  joined,
  socket,
  initialMessages,
  setError,
}: UseMeetingChatProps) {
  const [messages, setMessages] = useState<MeetingMessage[]>([]);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!joined || !socket) return;

    const onMessage = (incoming: MeetingMessage) => {
      setMessages((current) => {
        if (current.some((item) => item.id === incoming.id)) {
          return current;
        }

        return [...current, incoming];
      });
    };

    socket.on("chat:message", onMessage);

    return () => {
      socket.off("chat:message", onMessage);
    };
  }, [joined, socket]);

  const sendChat = useCallback(async () => {
    const clean = message.trim();

    if (!clean || !socket?.connected) return;

    try {
      await new Promise<void>((resolve, reject) => {
        socket.emit("chat:send", { message: clean }, (response) => {
          if (response.ok) {
            resolve();
            return;
          }

          reject(new Error(response.error ?? "Unable to send message."));
        });
      });

      setMessage("");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send message."
      );
    }
  }, [message, socket, setError]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return {
    messages,
    message,
    setMessage,
    messagesEndRef,
    sendChat,
  };
}
