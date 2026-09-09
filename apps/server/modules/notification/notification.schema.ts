import { z } from "zod";

export const ListNotificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type ListNotificationsQuery = z.infer<typeof ListNotificationsQuerySchema>;