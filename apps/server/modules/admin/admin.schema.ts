import { z } from "zod";

// GET /api/admin/reviewers — basic search + active/inactive filter
export const ListReviewersQuerySchema = z.object({
  search: z.string().trim().max(150).optional(),
  status: z.enum(["active", "inactive", "all"]).optional().default("all"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type ListReviewersQuery = z.infer<typeof ListReviewersQuerySchema>;

export const ReviewerIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type ReviewerIdParams = z.infer<typeof ReviewerIdParamsSchema>;

// PATCH /api/admin/reviewers/:id — deactivate/reactivate
export const UpdateReviewerStatusSchema = z.object({
  isActive: z.boolean(),
});

export type UpdateReviewerStatusInput = z.infer<typeof UpdateReviewerStatusSchema>;

// GET /api/admin/bookings — basic filters per task doc
export const ListBookingsQuerySchema = z.object({
  status: z.enum(["confirmed", "cancelled", "completed", "no_show", "rescheduled"]).optional(),
  reviewerId: z.coerce.number().int().positive().optional(),
  fromDate: z.string().date().optional(),
  toDate: z.string().date().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type ListBookingsQuery = z.infer<typeof ListBookingsQuerySchema>;