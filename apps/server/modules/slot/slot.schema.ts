import { z } from "zod";

export const GenerateSlotsSchema = z.object({
  eventTypeId: z.number().int().positive(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dateFrom must be YYYY-MM-DD"),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dateTo must be YYYY-MM-DD"),
})
.refine(
    (data) => new Date(data.dateTo) >= new Date(data.dateFrom),
    { message: "dateTo must be after dateFrom", path: ["dateTo"] }
  )
.refine(
    (data) => {
      const diffDays = (new Date(data.dateTo).getTime() - new Date(data.dateFrom).getTime()) / 86400000;
      return diffDays <= 90;
    },
    { message: "Date range cannot exceed 90 days", path: ["dateTo"] }
  );

export type GenerateSlotsInput = z.infer<typeof GenerateSlotsSchema>;

// Used to hold a slot while the advisor fills out the booking form
export const HoldSlotParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type HoldSlotParamsInput = z.infer<typeof HoldSlotParamsSchema>;