import { create } from "zustand";
import type { Notification } from "../types";
import * as api from "../api/notificationApi";
import { getNotificationSocket } from "../socket/notificationSocket";

type NotificationState = {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  latestToast: Notification | null;

  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  clearLatestToast: () => void;
  subscribeToSocket: () => () => void;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  latestToast: null,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const { notifications, unreadCount } = await api.listNotifications();
      set({ notifications, unreadCount, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => {
      // Avoid duplicate insertion
      const exists = state.notifications.some((n) => n.id === notification.id);
      if (exists) return state;

      return {
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
        latestToast: notification,
      };
    });
  },

  clearLatestToast: () => {
    set({ latestToast: null });
  },

  subscribeToSocket: () => {
    const socket = getNotificationSocket();
    if (!socket) return () => {};

    const handleNewNotification = (notification: Notification) => {
      get().addNotification(notification);
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  },

  markAsRead: async (id) => {
    const target = get().notifications.find((n) => n.id === id);
    if (!target || target.isRead) return;

    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    try {
      await api.markAsRead(id);
    } catch {
      get().fetchNotifications();
    }
  },

  markAllAsRead: async () => {
    if (get().unreadCount === 0) return;

    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));

    try {
      await api.markAllAsRead();
    } catch {
      get().fetchNotifications();
    }
  },
}));