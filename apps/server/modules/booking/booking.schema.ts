import { z } from "zod";

// Advisor booking form submission — confirms a held slot.
//
// NOTE: the `bookings` table has no `advisorName` column (only
// advisorEmail). We still collect advisorName here so it can be included
// in the confirmation response, but it is NOT persisted to the DB.
// Flagged with Adil — table needs an `advisor_name` column if this should
// be stored long-term.
export const CreateBookingSchema = z.object({
  holdToken: z.string().uuid("Invalid hold token"),
  advisorName: z.string().min(1, "Advisor name is required").max(150),
  advisorEmail: z.string().email("Invalid advisor email"),
  internName: z.string().min(1, "Intern name is required").max(150),
  batch: z.string().min(1, "Batch is required").max(50),
  // Optional per docs: "Intern Email(s) — optional", supports multiple emails
  internEmails: z.array(z.string().email()).max(10).optional(),
  weekStage: z.string().min(1, "Week/stage is required").max(255),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

export const CancelBookingParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CancelBookingParamsInput = z.infer<typeof CancelBookingParamsSchema>;