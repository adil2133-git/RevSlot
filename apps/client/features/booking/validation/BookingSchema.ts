import { z } from "zod";

export const bookingSchema = z.object({
  advisorName: z.string().trim().min(1, "Advisor name is required"),
  advisorEmail: z.string().trim().email("Enter a valid email address"),
  internName: z.string().trim().min(1, "Intern name is required"),
  batch: z.string().trim().min(1, "Batch is required"),
  internEmails: z
    .string()
    .optional()
    .refine((value) => {
      if (!value || !value.trim()) return true;
      const emails = value.split(",").map((e) => e.trim()).filter(Boolean);
      if (emails.length > 10) return false;
      return emails.every((e) => z.string().email().safeParse(e).success);
    }, "Enter valid email(s), separated by commas"),
  weekStage: z.string().trim().min(1, "Week / stage is required"),
});

export type BookingFormValues = z.infer<typeof bookingSchema>;