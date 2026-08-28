export type EventType = {
  id: number;
  reviewerId: number;
  availabilityTemplateId: number;
  name: string;
  slug: string;
  description: string | null;
  durationMinutes: number;
  price: number; // integer rupees — 0 = free, 500 = ₹500 (backend is INR-only, no currency field)
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  meetingLink: string | null;
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateEventTypePayload = {
  availabilityTemplateId: number;
  name: string;
  description?: string;
  durationMinutes: number;
  price?: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  meetingLink?: string;
};

// Everything optional — PATCH only sends what actually changed.
// isActive lives here too since editing status is part of the same form.
export type UpdateEventTypePayload = Partial<CreateEventTypePayload> & {
  isActive?: boolean;
  isPublic?: boolean;
};

export type EventTypeListResponse = {
  success: boolean;
  data: EventType[];
};

export type EventTypeResponse = {
  success: boolean;
  data: EventType;
};