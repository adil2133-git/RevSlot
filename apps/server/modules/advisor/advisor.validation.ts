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

export type SendOtpInput = z.infer<typeof SendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export type GetAdvisorBookingsQueryInput = z.infer<typeof GetAdvisorBookingsQuerySchema>;
