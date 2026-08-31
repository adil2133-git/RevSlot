import type { Request, Response } from "express";
import { dashboardService } from "./dashboard.service.js";
import {
  GetDashboardSummaryQuerySchema,
  type GetDashboardSummaryQueryInput,
  BookingIdParamSchema,
} from "./dashboard.schema.js";

export const dashboardController = {
  getSummary: async (req: Request, res: Response) => {
    const query =
      (res.locals.query as GetDashboardSummaryQueryInput) ||
      GetDashboardSummaryQuerySchema.parse(req.query);

    const result = await dashboardService.getReviewerSummary(req.user!.userId, query);

    res.status(200).json({
      success: true,
      data: result,
    });
  },

  getReferenceQuestions: async (req: Request, res: Response) => {
    const { bookingId } = BookingIdParamSchema.parse(req.params);

    const result = await dashboardService.getBookingReferenceQuestions(
      req.user!.userId,
      bookingId
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  },
};
