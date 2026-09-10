import { z } from "zod";
import type { BookingFormField } from "../type";

export const DEFAULT_BOOKING_FORM_VALUES = {
  fullName: "",
  email: "",
  whatsappNumber: "",
  mainlyFocusedFor: "",
  comments: "",
} as const;

export function buildBookingSchema(fields: BookingFormField[]) {
  const shape: Record<string, z.ZodTypeAny> = {
    fullName: z.string().trim().min(1, "Full name is required"),
    email: z.string().trim().email("Enter a valid email address"),
    whatsappNumber: z.string().trim().min(1, "WhatsApp number is required"),
    mainlyFocusedFor: z
     .string()
     .trim()
     .min(1, "Mainly focused for is required"),
    comments: z.string().optional(),
  };

  for (const field of fields) {
    if (field.fieldKey in shape) continue;

    let validator = z.string().trim();

    if (field.type === "email") {
      validator = z
        .string()
        .trim()
        .email(`Enter a valid ${field.label.toLowerCase()}`);
    } else if (field.type === "url") {
      validator = z
        .string()
        .trim()
        .url(`Enter a valid ${field.label.toLowerCase()}`);
    }

    shape[field.fieldKey] = validator.optional();
  }

  return z.object(shape);
}

export type BookingFormValues = Record<string, string>;