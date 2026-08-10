import { z } from "zod";

export const RegisterSchema = z.object({
    name: z.string().trim().min(2).max(50),
    email: z.email().trim().toLowerCase(),
    whatsappNumber: z.string().trim().regex(/^\+?[0-9]{10,15}$/, "Invalid WhatsApp number"),
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const LoginSchema = z.object({
    email: z.email().trim().toLowerCase(),
    password: z.string().min(8).max(72),
});


export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>