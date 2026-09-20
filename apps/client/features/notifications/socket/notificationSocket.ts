"use client";

import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/token";

const SOCKET_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

let socket: Socket | null = null;

export const getNotificationSocket = (): Socket | null => {
  if (typeof window === "undefined") return null;

  let token: string | null = null;
  try {
    token = typeof getAccessToken === "function" ? getAccessToken() : null;
  } catch {
    token = null;
  }
  if (!token) return null;

  if (socket && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  socket = io(`${SOCKET_URL}/notifications`, {
    withCredentials: true,
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  return socket;
};

export const disconnectNotificationSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
