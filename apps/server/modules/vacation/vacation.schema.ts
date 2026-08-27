import { z } from "zod";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

// Validates input for creating a new vacation block
export const CreateVacationBlockSchema = z.object({
  startDate: dateString,
  endDate: dateString,
  reason: z.string().trim().max(255).optional(),
  confirmCancellations: z.boolean().optional().default(false),
}).refine((data) => data.endDate >= data.startDate, {
  message: "endDate must be on or after startDate",
  path: ["endDate"],
});

// Validates input for updating an existing vacation block
export const UpdateVacationBlockSchema = z.object({
  startDate: dateString.optional(),
  endDate: dateString.optional(),
  reason: z.string().trim().max(255).optional(),
  confirmCancellations: z.boolean().optional().default(false),
}).refine(
  (data) => !data.startDate || !data.endDate || data.endDate >= data.startDate,
  { message: "endDate must be on or after startDate", path: ["endDate"] }
);

export type CreateVacationBlockInput = z.infer<typeof CreateVacationBlockSchema>;
export type UpdateVacationBlockInput = z.infer<typeof UpdateVacationBlockSchema>;