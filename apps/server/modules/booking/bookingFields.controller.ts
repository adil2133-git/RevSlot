import type { Request, Response } from "express";
import { bookingFieldsService } from "./bookingFields.service.js";

export const bookingFieldsController = {
  getBookingFields: async (req: Request, res: Response) => {
    const result = await bookingFieldsService.getBookingFields(req.user!.userId);
    res.status(200).json({ success: true, data: result });
  },

  replaceBookingFields: async (req: Request, res: Response) => {
    const result = await bookingFieldsService.replaceBookingFields(req.user!.userId, req.body);
    res.status(200).json({
      success: true,
      message: "Booking fields updated successfully",
      data: result,
    });
  },
};