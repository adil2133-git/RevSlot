import api from "@/lib/axios";
import type { Notification } from "../types";

type DataEnvelope<T> = { success: true; data: T };

export async function listNotifications(limit = 20) {
  const { data } = await api.get<
    DataEnvelope<{
      notifications: Notification[];
      unreadCount: number;
    }>
  >("/notifications", { params: { limit } });

  return data.data;
}

export async function markAsRead(id: number) {
  const { data } = await api.patch<DataEnvelope<{ notification: Notification }>>(
    `/notifications/${id}/read`
  );
  return data.data.notification;
}

export async function markAllAsRead() {
  await api.patch(`/notifications/read-all`);
}