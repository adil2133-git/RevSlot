import { z } from "zod";

export const SendOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const VerifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Code must be 6 digits"),
});

export const GetAdvisorBookingsQuerySchema = z.object({
  scope: z.enum(["upcoming", "past", "cancelled"]).optional().default("upcoming"),
  search: z.string().optional().default(""),
});

export const CancelAdvisorBookingSchema = z.object({
  reason: z.string().max(255).optional().default("Cancelled by advisor"),
});

export const RescheduleAdvisorBookingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid startTime format (HH:mm or HH:mm:ss)"),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid endTime format (HH:mm or HH:mm:ss)"),
  reason: z.string().max(255).optional(),
});

export type SendOtpInput = z.infer<typeof SendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export type GetAdvisorBookingsQueryInput = z.infer<typeof GetAdvisorBookingsQuerySchema>;
export type CancelAdvisorBookingInput = z.infer<typeof CancelAdvisorBookingSchema>;
export type RescheduleAdvisorBookingInput = z.infer<typeof RescheduleAdvisorBookingSchema>;
