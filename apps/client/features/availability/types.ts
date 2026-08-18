export interface TimeBlock {
  id: number;
  templateId: number;
  dayOfWeek: number; // 0=Sun ... 6=Sat
  startTime: string; // "HH:MM" or "HH:MM:SS"
  endTime: string;
  displayOrder: number | null;
}

export interface AvailabilityTemplate {
  id: number;
  reviewerId: number;
  name: string;
  description: string | null;
  timezone: string;
  isDefault: boolean;
  createdAt: string;
  timeBlocks: TimeBlock[];
}

export interface ListTemplatesResponse {
  success: boolean;
  data: { templates: AvailabilityTemplate[] };
}

export interface TimeBlockPayload {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  displayOrder: number;
}

export interface TemplatePayload {
  name: string;
  description?: string;
  timezone: string;
  isDefault: boolean;
}

export interface OverrideBlock {
  id: number;
  overrideId: number;
  startTime: string;
  endTime: string;
  displayOrder: number | null;
}

export interface DateOverride {
  id: number;
  templateId: number;
  date: string; // "YYYY-MM-DD"
  isUnavailable: boolean;
  blocks: OverrideBlock[];
}

export interface CreateOverridePayload {
  date: string;
  isUnavailable: boolean;
  blocks: { startTime: string; endTime: string; displayOrder: number }[];
}