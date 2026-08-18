import type { Request, Response } from "express";
import { bookingService } from "./booking.service.js";

export const bookingController = {
  createBooking: async (req: Request, res: Response) => {
    const result = await bookingService.createBooking(req.body);

    res.status(201).json({
      success: true,
      data: result,
    });
  },
};