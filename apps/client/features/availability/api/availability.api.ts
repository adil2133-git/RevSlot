import api from "@/lib/axios";
import type { ListTemplatesResponse, TemplatePayload, TimeBlockPayload, AvailabilityTemplate } from "../types";

export async function fetchTemplates() {
  const { data } = await api.get<ListTemplatesResponse>("/availability-templates");
  return data.data.templates;
}

export async function deleteTemplateRequest(id: number) {
  await api.delete(`/availability-templates/${id}`);
}

export async function createTemplateRequest(payload: TemplatePayload) {
  const { data } = await api.post<{ success: boolean; data: { template: AvailabilityTemplate } }>(
    "/availability-templates",
    payload
  );
  return data.data.template;
}

export async function updateTemplateRequest(id: number, payload: Partial<TemplatePayload>) {
  const { data } = await api.patch<{ success: boolean; data: { template: AvailabilityTemplate } }>(
    `/availability-templates/${id}`,
    payload
  );
  return data.data.template;
}

export async function getTemplateByIdRequest(id: number) {
  const { data } = await api.get<{ success: boolean; data: { template: AvailabilityTemplate } }>(
    `/availability-templates/${id}`
  );
  return data.data.template;
}

export async function replaceTimeBlocksRequest(id: number, blocks: TimeBlockPayload[]) {
  const { data } = await api.put<{ success: boolean; data: { blocks: unknown } }>(
    `/availability-templates/${id}/time-blocks`,
    { blocks }
  );
  return data.data.blocks;
}