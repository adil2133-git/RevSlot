import type { Request, Response } from "express";
import { bookingService } from "./booking.service.js";
import { AppError } from "../../core/errors/AppError.js";
import {
  GetMyBookingsQuerySchema,
  type GetMyBookingsQueryInput,
  BookingIdParamSchema,
} from "./booking.validation.js";

const parseBookingId = (params: Request["params"]) => {
  const result = BookingIdParamSchema.safeParse(params);
  if (!result.success) {
    throw new AppError("Invalid booking id", 400);
  }
  return result.data.id;
};

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
    const id = parseBookingId(req.params);
    const result = await bookingService.getBookingById(req.user!.userId, id);
    res.status(200).json({ success: true, data: result });
  },

  cancelBooking: async (req: Request, res: Response) => {
    const id = parseBookingId(req.params);
    const result = await bookingService.cancelBooking(req.user!.userId, id, req.body);
    res.status(200).json({ success: true, data: result });
  },

  rescheduleBooking: async (req: Request, res: Response) => {
    const id = parseBookingId(req.params);
    const oldBooking = await bookingService.getBookingById(req.user!.userId, id);
    const newBooking = await bookingService.rescheduleBooking(req.user!.userId, id, req.body);
    const { meetLink } = await bookingService.finalizeReschedule(oldBooking, newBooking);
    res.status(200).json({ success: true, data: { ...newBooking, meetLink } });
  },

  markOutcome: async (req: Request, res: Response) => {
    const id = parseBookingId(req.params);
    const { outcome } = req.body;
    const result = await bookingService.markOutcome(req.user!.userId, id, outcome);
    res.status(200).json({ success: true, data: result });
  },
};