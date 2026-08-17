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