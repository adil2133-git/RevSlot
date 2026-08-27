import { z } from "zod";

// Public URL slug: /:username/:eventSlug — must mirror the server's rules.
const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "At least 3 characters")
  .max(30, "At most 30 characters")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers, and hyphens only");

export const registerSchema = z
  .object({
    name: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    username: usernameSchema,
    whatsappNumber: z
      .string()
      .min(10, "Enter a valid WhatsApp number")
      .max(15, "Number is too long")
      .regex(/^\+?[0-9\s-]+$/, "Numbers only"),
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    otp: z.string().length(6, "Enter the 6-digit code"),
    newPassword: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

// Only asked for when the backend tells us this is a brand-new Google
// user (422 response) — not part of the normal Google sign-in click.
export const googleWhatsappSchema = z.object({
  whatsappNumber: z
    .string()
    .min(10, "Enter a valid WhatsApp number")
    .max(15, "Number is too long")
    .regex(/^\+?[0-9\s-]+$/, "Numbers only"),
  username: usernameSchema,
});

export type GoogleWhatsappFormValues = z.infer<typeof googleWhatsappSchema>;