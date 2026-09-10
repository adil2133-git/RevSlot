import { Router } from "express";
import { advisorController } from "./advisor.controller.js";
import { requireAdvisor } from "../../core/middlewares/auth.middleware.js";
import { catchAsync } from "../../core/utils/catchAsync.js";

const router = Router();

// OTP Auth Endpoints
router.post("/auth/send-otp", catchAsync(advisorController.sendOtp));
router.post("/auth/verify-otp", catchAsync(advisorController.verifyOtp));

// Protected Advisor Bookings & Feedback Endpoints
router.get("/bookings", requireAdvisor, catchAsync(advisorController.getAdvisorBookings));
router.get("/bookings/:id/feedback", requireAdvisor, catchAsync(advisorController.getAdvisorBookingFeedback));
router.patch("/bookings/:id/cancel", requireAdvisor, catchAsync(advisorController.cancelAdvisorBooking));
router.patch("/bookings/:id/reschedule", requireAdvisor, catchAsync(advisorController.rescheduleAdvisorBooking));

export default router;
