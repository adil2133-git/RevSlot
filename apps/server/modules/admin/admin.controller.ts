import type { Request, Response } from "express";
import { adminService } from "./admin.service.js";
import type { ListReviewersQuery, ListBookingsQuery, UpdateAdminProfileInput } from "./admin.validation.js";

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
    const reviewer = await adminService.updateReviewerStatus(reviewerId, req.body, req.user!.userId);
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

  getAnalytics: async (_req: Request, res: Response) => {
    const analytics = await adminService.getAnalyticsData();
    res.status(200).json({ success: true, data: analytics });
  },

  exportCSV: async (_req: Request, res: Response) => {
    const csvData = await adminService.exportAnalyticsCSV();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=revslot_analytics_${Date.now()}.csv`);
    res.status(200).send(csvData);
  },

  listFeedback: async (_req: Request, res: Response) => {
    const query = res.locals.query;
    const result = await adminService.listFeedbackHistory(query);
    res.status(200).json({ success: true, data: result });
  },

  getProfile: async (req: Request, res: Response) => {
    const profile = await adminService.getProfile(req.user!.userId);
    res.status(200).json({ success: true, data: { admin: profile } });
  },

  updateProfile: async (req: Request, res: Response) => {
    const input = req.body as UpdateAdminProfileInput;
    const admin = await adminService.updateProfile(req.user!.userId, input);
    res.status(200).json({ success: true, data: { admin } });
  },

  listPayouts: async (req: Request, res: Response) => {
    const { adminPayoutsService } = await import("./admin.payouts.service.js");
    const status = req.query.status as any;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result = await adminPayoutsService.listPayoutRequests({ status, page, limit });
    res.status(200).json({ success: true, data: result });
  },

  processPayout: async (req: Request, res: Response) => {
    const { adminPayoutsService } = await import("./admin.payouts.service.js");
    const payoutId = Number(req.params.id);
    const { action, transactionReference, adminNotes } = req.body;

    const updated = await adminPayoutsService.processPayout(
      payoutId,
      req.user!.userId,
      { action, transactionReference, adminNotes }
    );
    res.status(200).json({ success: true, data: updated });
  },
};