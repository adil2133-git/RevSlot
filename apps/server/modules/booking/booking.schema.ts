import { z } from "zod";

// Advisor booking form submission — confirms a held slot.
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

// Query params for GET /bookings/me — pagination + optional status/scope filters
export const GetMyBookingsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      if (Array.isArray(val)) return val as ("confirmed" | "completed")[];
      return val.split(",") as ("confirmed" | "completed")[];
    }),
  scope: z.enum(["upcoming", "past"]).optional(),
});

export type GetMyBookingsQueryInput = z.infer<typeof GetMyBookingsQuerySchema>;