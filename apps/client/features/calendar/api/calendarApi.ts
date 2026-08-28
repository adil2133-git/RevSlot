import api from "@/lib/axios";

export type CalendarStatus = {
  googleCalendarConnected: boolean;
  googleCalendarEmail: string | null;
};

export async function fetchCalendarStatus() {
  const { data } = await api.get<{
    success: boolean;
    data: CalendarStatus;
  }>("/calendar/google/status");

  return data.data;
}

export async function getGoogleConnectUrl() {
  const { data } = await api.get<{
    success: boolean;
    data: { url: string };
  }>("/calendar/google/connect");

  return data.data.url;
}

export async function disconnectGoogleCalendar() {
  await api.post("/calendar/google/disconnect");
}