import type { Request, Response } from "express";
import { advisorService } from "./advisor.service.js";
import {
  SendOtpSchema,
  VerifyOtpSchema,
  GetAdvisorBookingsQuerySchema,
  CancelAdvisorBookingSchema,
  RescheduleAdvisorBookingSchema,
} from "./advisor.validation.js";
import { BookingIdParamSchema } from "../booking/booking.validation.js";
import { AppError } from "../../core/errors/AppError.js";

const parseBookingId = (params: Request["params"]) => {
  const result = BookingIdParamSchema.safeParse(params);
  if (!result.success) {
    throw new AppError("Invalid booking id", 400);
  }
  return result.data.id;
};

export const advisorController = {
  sendOtp: async (req: Request, res: Response) => {
    const { email } = SendOtpSchema.parse(req.body);
    const result = await advisorService.sendOtp(email);
    res.status(200).json({ success: true, ...result });
  },

  verifyOtp: async (req: Request, res: Response) => {
    const { email, code } = VerifyOtpSchema.parse(req.body);
    const result = await advisorService.verifyOtp(email, code);

    res.cookie("advisorToken", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ success: true, data: result });
  },

  getAdvisorBookings: async (req: Request, res: Response) => {
    const advisorEmail = res.locals.advisorEmail;
    const query = GetAdvisorBookingsQuerySchema.parse(req.query);
    const result = await advisorService.getAdvisorBookings(advisorEmail, query);
    res.status(200).json({ success: true, data: result });
  },

  getAdvisorBookingFeedback: async (req: Request, res: Response) => {
    const advisorEmail = res.locals.advisorEmail;
    const id = parseBookingId(req.params);
    const result = await advisorService.getAdvisorBookingFeedback(advisorEmail, id);
    res.status(200).json({ success: true, data: result });
  },

  cancelAdvisorBooking: async (req: Request, res: Response) => {
    const advisorEmail = res.locals.advisorEmail;
    const id = parseBookingId(req.params);
    const body = CancelAdvisorBookingSchema.parse(req.body);
    const result = await advisorService.cancelAdvisorBooking(advisorEmail, id, body);
    res.status(200).json({ success: true, data: result });
  },

  rescheduleAdvisorBooking: async (req: Request, res: Response) => {
    const advisorEmail = res.locals.advisorEmail;
    const id = parseBookingId(req.params);
    const body = RescheduleAdvisorBookingSchema.parse(req.body);
    const result = await advisorService.rescheduleAdvisorBooking(advisorEmail, id, body);
    res.status(200).json({ success: true, data: result });
  },
};
