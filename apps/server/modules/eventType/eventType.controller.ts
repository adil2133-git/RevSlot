import type { Request, Response } from "express";
import { eventTypeService } from "./eventType.service.js";

export const eventTypeController = {
  getBookingPageInfo: async (req: Request, res: Response) => {
    const reviewerId = Number(req.params.reviewerId);
    const eventSlug = String(req.params.eventSlug);

    const result = await eventTypeService.getBookingPageInfo(reviewerId, eventSlug);

    res.status(200).json({
      success: true,
      data: result,
    });
  },
};