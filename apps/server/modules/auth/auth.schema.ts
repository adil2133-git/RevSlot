import { z } from "zod";

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

export const UpdateUsernameSchema = z.object({
  username: usernameSchema,
});

export const UpdateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50).optional(),
  bio: z.string().trim().max(300, "Bio must be at most 300 characters").optional(),
  whatsappNumber: z.string().trim().regex(/^\+?[0-9]{10,15}$/, "Invalid WhatsApp number").optional(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(72),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshInput = z.infer<typeof RefreshSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof ResendVerificationSchema>;
export type GoogleAuthInput = z.infer<typeof GoogleAuthSchema>;
export type UpdateUsernameInput = z.infer<typeof UpdateUsernameSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;