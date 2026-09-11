import type { Request, Response } from "express";
import { adminService } from "./admin.service.js";
import type {
  ListReviewersQuery,
  ListBookingsQuery,
  UpdateAdminProfileInput,
  ListAdminFeedbackQuery,
} from "./admin.schema.js";
import type { GetAnalyticsQuery } from "./analytics.schema.js";

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

  listFeedbackHistory: async (req: Request, res: Response) => {
    const query = (res.locals.query || {}) as ListAdminFeedbackQuery;
    const result = await adminService.listFeedbackHistory(query);
    res.status(200).json({ success: true, data: result });
  },

  getFeedbackDetails: async (req: Request, res: Response) => {
    const feedbackId = Number(req.params.id);
    const feedbackRecord = await adminService.getFeedbackDetails(feedbackId);
    res.status(200).json({ success: true, data: { feedback: feedbackRecord } });
  },

  getAnalytics: async (_req: Request, res: Response) => {
    const query = (res.locals.query || {}) as GetAnalyticsQuery;
    const analytics = await adminService.getAnalytics(query);
    res.status(200).json({ success: true, data: analytics });
  },

  exportAnalyticsCsv: async (_req: Request, res: Response) => {
    const query = (res.locals.query || {}) as GetAnalyticsQuery;
    const csvData = await adminService.exportAnalyticsCsvData(query);
    const filename = `revslot-analytics-${query.range || "custom"}-${Date.now()}.csv`;
    
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(csvData);
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
};