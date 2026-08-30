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
    .string()
    .optional()
    .transform((val) => val?.split(",") as ("confirmed" | "completed")[] | undefined),
  scope: z.enum(["upcoming", "past"]).optional(),
});

export type GetMyBookingsQueryInput = z.infer<typeof GetMyBookingsQuerySchema>;

// Route param validation shared by GET /:id, PATCH /:id/cancel, PATCH /:id/reschedule
export const BookingIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type BookingIdParamInput = z.infer<typeof BookingIdParamSchema>;

// Reviewer-initiated cancellation — reason is required so it can be
// shown to the advisor and stored as an audit trail (bookings.cancelledReason).
export const CancelBookingSchema = z.object({
  reason: z.string().min(1, "Cancellation reason is required").max(255),
});

export type CancelBookingInput = z.infer<typeof CancelBookingSchema>;

// Reviewer-initiated reschedule — new date/time for the SAME event type,
// re-validated against live availability via slotService.holdSlot.
export const RescheduleBookingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format (HH:MM)"),
});

export type RescheduleBookingInput = z.infer<typeof RescheduleBookingSchema>;