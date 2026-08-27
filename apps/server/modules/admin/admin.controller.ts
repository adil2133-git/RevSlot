import type { Request, Response } from "express";
import { adminService } from "./admin.service.js";
import type { ListReviewersQuery, ListBookingsQuery } from "./admin.schema.js";

export const adminController = {
  listReviewers: async (req: Request, res: Response) => {
    // validateQuery puts the parsed/defaulted query on res.locals.query —
    // req.query is read-only in this Express version and can't be reassigned.
    const query = res.locals.query as ListReviewersQuery;
    const result = await adminService.listReviewers(query);
    res.status(200).json({ success: true, data: result });
  },

  updateReviewerStatus: async (req: Request, res: Response) => {
    const reviewerId = Number(req.params.id);
    const reviewer = await adminService.updateReviewerStatus(reviewerId, req.body);
    res.status(200).json({ success: true, data: { reviewer } });
  },

  listBookings: async (req: Request, res: Response) => {
    const query = res.locals.query as ListBookingsQuery;
    const result = await adminService.listBookings(query);
    res.status(200).json({ success: true, data: result });
  },

  getDashboardStats: async (_req: Request, res: Response) => {
    const stats = await adminService.getDashboardStats();
    res.status(200).json({ success: true, data: stats });
  },
};