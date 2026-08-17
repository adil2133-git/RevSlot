import api from "@/lib/axios";
import type { ListTemplatesResponse } from "../types";

export async function fetchTemplates() {
  const { data } = await api.get<ListTemplatesResponse>("/availability-templates");
  return data.data.templates;
}

export async function deleteTemplateRequest(id: number) {
  await api.delete(`/availability-templates/${id}`);
}