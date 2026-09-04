import { z } from "zod";

// Used by the public booking page to look up a reviewer + event type
// by username and event slug (e.g. /shibin/project-review)
export const BookingPageParamsSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  eventSlug: z.string().trim().min(1, "eventSlug is required"),
});

// Used by the public profile page (e.g. /shibin) — just a username,
// returns the reviewer + their active event types to pick from.
export const ReviewerProfileParamsSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
});

export const CreateEventTypeSchema = z.object({
    availabilityTemplateId: z.number().int().positive(),
    feedbackFormId: z.number().int().positive("Please select a feedback form"),
    name: z.string().trim().min(1, "Event name is required").max(150, "Event name must be at most 150 characters"),
    description: z.string().trim().max(1000, "Description must be at most 1000 characters").optional(),
    durationMinutes: z.number().int().positive("Duration must be greater than 0"),
    price: z.number().int().min(0, "Price cannot be negative").default(0),
    bufferBeforeMinutes: z.number().int().min(0, "Buffer cannot be negative").default(0),
    bufferAfterMinutes: z.number().int().min(0, "Buffer cannot be negative").default(0),
    meetingLink: z.string().trim().url("Invalid meeting link").max(500, "Meeting link must be at most 500 characters").optional(),
    isPublic: z.boolean().default(true),
});

export const UpdateEventTypeSchema = z.object({
  availabilityTemplateId: z.number().int().positive().optional(),
  feedbackFormId: z.number().int().positive().optional(),
  name: z.string().trim().min(1, "Event name is required").max(150, "Event name must be at most 150 characters").optional(),
  description: z.string().trim().max(1000, "Description must be at most 1000 characters").nullable().optional(),
  durationMinutes: z.number().int().positive("Duration must be greater than 0").optional(),
  price: z.number().int().min(0, "Price cannot be negative").optional(),
  bufferBeforeMinutes: z.number().int().min(0, "Buffer cannot be negative").optional(),
  bufferAfterMinutes: z.number().int().min(0, "Buffer cannot be negative").optional(),
  meetingLink: z.string().trim().url("Invalid meeting link").max(500, "Meeting link must be at most 500 characters").nullable().optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

export type BookingPageParamsInput = z.infer<typeof BookingPageParamsSchema>;
export type ReviewerProfileParamsInput = z.infer<typeof ReviewerProfileParamsSchema>;
export type CreateEventTypeInput = z.infer<typeof CreateEventTypeSchema>;
export type UpdateEventTypeInput = z.infer<typeof UpdateEventTypeSchema>;