import api from "@/lib/axios";
import type { DateOverride, CreateOverridePayload } from "../types";

export async function createOverrideRequest(templateId: number, payload: CreateOverridePayload) {
  const { data } = await api.post<{ success: boolean; data: { override: DateOverride } }>(
    `/availability-templates/${templateId}/date-overrides`,
    payload
  );
  return data.data.override;
}

export async function listOverridesRequest(templateId: number) {
  const { data } = await api.get<{ success: boolean; data: { overrides: DateOverride[] } }>(
    `/availability-templates/${templateId}/date-overrides`
  );
  return data.data.overrides;
}

export async function deleteOverrideRequest(templateId: number, overrideId: number) {
  await api.delete(`/availability-templates/${templateId}/date-overrides/${overrideId}`);
}