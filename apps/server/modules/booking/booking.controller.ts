import type { Request, Response } from "express";
import dayjs from "dayjs";
import { bookingService } from "./booking.service.js";
import { notificationService } from "../notification/notification.service.js";
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

    await notificationService.createNotification({
      reviewerId: result.reviewerId,
      type: "booking_created",
      title: "New booking",
      message: `${result.advisorName} booked a session for ${dayjs(result.startTime).format("ddd, MMM D, h:mm A")}`,
      bookingId: result.id,
    });

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

     if (result) {
      await notificationService.createNotification({
        reviewerId: req.user!.userId,
        type: "booking_cancelled",
        title: "Booking cancelled",
        message: `Session with ${result.advisorName} on ${dayjs(result.startTime).format("ddd, MMM D")} was cancelled`,
        bookingId: result.id,
      });
    }
    res.status(200).json({ success: true, data: result });
  },

  rescheduleBooking: async (req: Request, res: Response) => {
    const id = parseBookingId(req.params);
    const result = await bookingService.requestReschedule(req.user!.userId, id, req.body);

    if (result) {
      await notificationService.createNotification({
        reviewerId: req.user!.userId,
        type: "booking_rescheduled",
        title: "Reschedule requested",
        message: `Reschedule request sent to ${result.advisorName}`,
        bookingId: result.id,
      });
    }

    res.status(200).json({ success: true, data: result });
  },

  requestReschedule: async (req: Request, res: Response) => {
    const id = parseBookingId(req.params);
    const result = await bookingService.requestReschedule(req.user!.userId, id, req.body);

    if (result) {
      await notificationService.createNotification({
        reviewerId: req.user!.userId,
        type: "booking_rescheduled",
        title: "Reschedule requested",
        message: `Reschedule request sent to ${result.advisorName}`,
        bookingId: result.id,
      });
    }

    res.status(200).json({ success: true, data: result });
  },

  getRescheduleRequestByToken: async (req: Request, res: Response) => {
    const token = String(req.params.token || "");
    const result = await bookingService.getRescheduleRequestByToken(token);
    res.status(200).json({ success: true, data: result });
  },

  respondToReschedule: async (req: Request, res: Response) => {
    const token = String(req.params.token || "");
    const result = await bookingService.respondToReschedule(token, req.body);

    if (result) {
      const actionText = req.body.action === "accept" ? "accepted" : "declined";
      await notificationService.createNotification({
        reviewerId: result.reviewerId,
        type: "booking_rescheduled",
        title: `Reschedule ${actionText}`,
        message: `${result.advisorName} ${actionText} the reschedule request`,
        bookingId: result.id,
      });
    }

    res.status(200).json({ success: true, data: result });
  },

  markOutcome: async (req: Request, res: Response) => {
    const id = parseBookingId(req.params);
    const { outcome } = req.body;
    const result = await bookingService.markOutcome(req.user!.userId, id, outcome);
    
    if (outcome === "completed") {
      await notificationService.createNotification({
        reviewerId: req.user!.userId,
        type: "booking_completed",
        title: "Session completed",
        message: `Session with ${result.advisorName} was marked completed`,
        bookingId: result.id,
      });
    }
    res.status(200).json({ success: true, data: result });
  },
};