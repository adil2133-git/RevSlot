import { z } from "zod";

// export const GenerateSlotsSchema = z.object({
//   eventTypeId: z.number().int().positive(),
//   dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dateFrom must be YYYY-MM-DD"),
//   dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dateTo must be YYYY-MM-DD"),
// })
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

export const GetAvailableSlotsQuerySchema = z
   .object({
     eventTypeId: z.coerce.number().int().positive(),
     dateFrom: z.string().regex(dateRegex, "dateFrom must be YYYY-MM-DD"),
     dateTo: z.string().regex(dateRegex, "dateTo must be YYYY-MM-DD"),
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

export const HoldSlotSchema = z.object({
   eventTypeId: z.number().int().positive(),
   date: z.string().regex(dateRegex, "date must be YYYY-MM-DD"),
   startTime: z.string().regex(timeRegex, "startTime must be HH:MM or HH:MM:SS"),
   endTime: z.string().regex(timeRegex, "endTime must be HH:MM or HH:MM:SS"),
});

export type GetAvailableSlotsQuery = z.infer<typeof GetAvailableSlotsQuerySchema>;
export type HoldSlotInput = z.infer<typeof HoldSlotSchema>;