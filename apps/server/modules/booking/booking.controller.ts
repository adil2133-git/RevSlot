import type { Request, Response } from "express";
import { bookingService } from "./booking.service.js";
import { GetMyBookingsQuerySchema, type GetMyBookingsQueryInput } from "./booking.schema.js";

export const bookingController = {
  createBooking: async (req: Request, res: Response) => {
    const result = await bookingService.createBooking(req.body);
    const { meetLink } = await bookingService.finalizeBooking(result);

    res.status(201).json({
      success: true,
      data: { ...result, meetLink },
    });
  },

  // Handles GET /bookings/me — reviewer's own bookings, paginated
  getMyBookings: async (req: Request, res: Response) => {
    const query =
      (res.locals.query as GetMyBookingsQueryInput) ||
      GetMyBookingsQuerySchema.parse(req.query);
    const result = await bookingService.getMyBookings(req.user!.userId, query);

    res.status(200).json({
      success: true,
      data: result,
    });
  },
};