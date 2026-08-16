import { z } from "zod";

// Advisor booking form — hold pannina slot ah confirm panna
export const CreateBookingSchema = z.object({
  holdToken: z.string().uuid("Invalid hold token"),
  advisorName: z.string().min(1, "Advisor name is required").max(150),
  advisorEmail: z.string().email("Invalid advisor email"),
  internName: z.string().max(150).optional(),
  internBatch: z.string().max(100).optional(),
  internEmails: z.array(z.string().email()).max(10).optional(),
  weekOrStage: z.string().max(100).optional(),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

export const CancelBookingParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CancelBookingParamsInput = z.infer<typeof CancelBookingParamsSchema>;