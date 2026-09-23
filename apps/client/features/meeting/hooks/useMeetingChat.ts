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
  participantId?: string;
  chatOpen?: boolean; 
};

export function useMeetingChat({
  joined,
  socket,
  initialMessages,
  setError,
  participantId,
  chatOpen = false,  
}: UseMeetingChatProps) {
  const [messages, setMessages] = useState<MeetingMessage[]>([]);
  const [message, setMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0); 
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
      const isOwnMessage =
        !!participantId &&
        incoming.participantId === participantId;

      if (!isOwnMessage && !chatOpen) {
          setUnreadCount((count) => count + 1);
       }
    };

    socket.on("chat:message", onMessage);

    return () => {
      socket.off("chat:message", onMessage);
    };
  }, [joined, socket, participantId, chatOpen]);

  useEffect(() => {
  if (chatOpen) {
    setUnreadCount(0);
  }
}, [chatOpen]);

  const sendMessageText = useCallback(
    async (text: string) => {
      const clean = text.trim();

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
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to send message."
        );

        throw err;
      }
    },
    [socket, setError]
  );

  const sendChat = useCallback(async () => {
    const clean = message.trim();

    if (!clean) return;

    try {
      await sendMessageText(clean);
      setMessage("");
    } catch {
      // sendMessageText already reported the error via setError.
    }
  }, [message, sendMessageText]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return {
    messages,
    message,
    setMessage,
    messagesEndRef,
    sendChat,
    sendMessageText,
    unreadCount,
  };
}
