import { z } from "zod";

// Public URL slug: /:username/:eventSlug — lowercase letters, numbers,
// single hyphens between segments, no leading/trailing hyphen.
const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Username can only contain lowercase letters, numbers, and hyphens"
  );

export const RegisterSchema = z.object({
    name: z.string().trim().min(2).max(50),
    email: z.email().trim().toLowerCase(),
    username: usernameSchema,
    whatsappNumber: z.string().trim().regex(/^\+?[0-9]{10,15}$/, "Invalid WhatsApp number"),
    password: z.string().min(8).max(72),
  });

export const LoginSchema = z.object({
    email: z.email().trim().toLowerCase(),
    password: z.string().min(8).max(72),
});

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const ForgotPasswordSchema = z.object({
  email: z.email().trim().toLowerCase(),
});

export const ResetPasswordSchema = z.object({
  email: z.email().trim().toLowerCase(),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(8).max(72),
});

export const VerifyEmailSchema = z.object({
  email: z.email().trim().toLowerCase(),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const ResendVerificationSchema = z.object({
  email: z.email().trim().toLowerCase(),
});

export const GoogleAuthSchema = z.object({
  idToken: z.string().min(1, "ID token is required"),
  whatsappNumber: z.string().trim().regex(/^\+?[0-9]{10,15}$/, "Invalid WhatsApp number").optional(),
  username: usernameSchema.optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>
export type RefreshInput = z.infer<typeof RefreshSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof ResendVerificationSchema>;
export type GoogleAuthInput = z.infer<typeof GoogleAuthSchema>;