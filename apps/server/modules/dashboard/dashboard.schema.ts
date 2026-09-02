import { z } from 'zod';

export const GetDashboardSummaryQuerySchema = z.object({
  date: z.string().optional(), // YYYY-MM-DD format (defaults to today)
  timeframe: z.enum(['today', 'week', 'month', 'all']).optional().default('today'),
});

export type GetDashboardSummaryQueryInput = z.infer<typeof GetDashboardSummaryQuerySchema>;

export const BookingIdParamSchema = z.object({
  bookingId: z.coerce.number().int().positive(),
});

export type BookingIdParamInput = z.infer<typeof BookingIdParamSchema>;
