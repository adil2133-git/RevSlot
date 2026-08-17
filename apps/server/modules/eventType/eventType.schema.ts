import { z } from "zod";

// Used by the public booking page to look up a reviewer + event type
// by reviewerId and event slug (e.g. /42/project-review)
export const BookingPageParamsSchema = z.object({
  reviewerId: z.coerce.number().int().positive(),
  eventSlug: z.string().min(1),
});

export type BookingPageParamsInput = z.infer<typeof BookingPageParamsSchema>;