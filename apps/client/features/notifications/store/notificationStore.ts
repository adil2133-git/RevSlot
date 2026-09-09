import { create } from "zustand";
import type { Notification } from "../types";
import * as api from "../api/notificationApi";

type NotificationState = {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const { notifications, unreadCount } = await api.listNotifications();
      set({ notifications, unreadCount, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  // Optimistic — flips isRead locally right away, decrements the badge,
  // then confirms with the server. Falls back to a refetch on failure
  // so the badge never drifts from what's actually on the backend.
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