import type { Request, Response } from "express";
import { bookingService } from "./booking.service.js";
import {
  GetMyBookingsQuerySchema,
  type GetMyBookingsQueryInput,
  BookingIdParamSchema,
} from "./booking.schema.js";

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

  getBookingById: async (req: Request, res: Response) => {
    const { id } = BookingIdParamSchema.parse(req.params);
    const result = await bookingService.getBookingById(req.user!.userId, id);
    res.status(200).json({ success: true, data: result });
  },

  cancelBooking: async (req: Request, res: Response) => {
    const { id } = BookingIdParamSchema.parse(req.params);
    const result = await bookingService.cancelBooking(req.user!.userId, id, req.body);
    res.status(200).json({ success: true, data: result });
  },

  rescheduleBooking: async (req: Request, res: Response) => {
    const { id } = BookingIdParamSchema.parse(req.params);
    const newBooking = await bookingService.rescheduleBooking(req.user!.userId, id, req.body);
    const { meetLink } = await bookingService.finalizeBooking({
      ...newBooking,
      advisorName: newBooking.advisorName,
    });
    res.status(200).json({ success: true, data: { ...newBooking, meetLink } });
  },
};