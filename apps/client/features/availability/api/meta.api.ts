import api from "@/lib/axios";

export interface TimezoneOption {
  value: string;
  label: string;
}
export interface TimeOption {
  value: string;
  label: string;
}

export async function fetchTimezoneOptions() {
  const { data } = await api.get<{ success: boolean; data: { timezones: TimezoneOption[] } }>(
    "/availability-templates/meta/timezones"
  );
  return data.data.timezones;
}

export async function fetchTimeOptions() {
  const { data } = await api.get<{ success: boolean; data: { timeOptions: TimeOption[] } }>(
    "/availability-templates/meta/time-options"
  );
  return data.data.timeOptions;
}