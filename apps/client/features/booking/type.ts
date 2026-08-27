export type BookingPageInfo = {
  reviewer: {
    id: number;
    name: string;
    avatarUrl: string | null;
    bio: string | null;
  };
  eventType: {
    id: number;
    name: string;
    slug: string;
    durationMinutes: number;
    description: string | null;
    timezone: string;
    bookingWindowDays: number;
  };
};

export type ReviewerProfile = {
  reviewer: {
    id: number;
    name: string;
    avatarUrl: string | null;
    bio: string | null;
  };
  eventTypes: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    durationMinutes: number;
    price: number;
  }[];
};

export type SlotItem = {
  eventTypeId: number;
  date: string;
  startTime: string;
  endTime: string;
};

export type HoldResult = {
  slotId: number;
  holdToken: string;
  holdExpiresAt: string;
};

export type BookingFormPayload = {
  holdToken: string;
  advisorName: string;
  advisorEmail: string;
  internName: string;
  batch: string;
  internEmails?: string[];
  weekStage: string;
};