import { z } from "zod";

export const ListAuditLogQuerySchema = z.object({
  action: z.string().trim().max(100).optional(),
  actorId: z.coerce.number().int().positive().optional(),
  targetType: z.string().trim().max(100).optional(),
  fromDate: z.string().date().optional(),
  toDate: z.string().date().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type ListAuditLogQuery = z.infer<typeof ListAuditLogQuerySchema>;