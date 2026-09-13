import { Router } from "express";
import { validate, validateQuery } from "../../core/middlewares/validate.middleware.js";
import { requireReviewer } from "../../core/middlewares/auth.middleware.js";
import {
  CreateBookingSchema,
  GetMyBookingsQuerySchema,
  CancelBookingSchema,
  RescheduleBookingSchema,
  RequestRescheduleSchema,
  RespondRescheduleSchema,
  MarkOutcomeSchema,
} from "./booking.validation.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import { bookingController } from "./booking.controller.js";

const router = Router();

router.post(
  "/",
  validate(CreateBookingSchema),
  catchAsync(bookingController.createBooking)
);

// Public tokenized endpoints for Advisor responding to reschedule requests
router.get(
  "/reschedule-request/:token",
  catchAsync(bookingController.getRescheduleRequestByToken)
);
router.post(
  "/reschedule-request/:token/respond",
  validate(RespondRescheduleSchema),
  catchAsync(bookingController.respondToReschedule)
);

// Reviewer-only — returns the logged-in reviewer's own bookings
router.get(
  "/me",
  requireReviewer,
  validateQuery(GetMyBookingsQuerySchema),
  catchAsync(bookingController.getMyBookings)
);

router.get("/:id", requireReviewer, catchAsync(bookingController.getBookingById));
router.patch(
  "/:id/cancel",
  requireReviewer,
  validate(CancelBookingSchema),
  catchAsync(bookingController.cancelBooking)
);
router.patch(
  "/:id/reschedule",
  requireReviewer,
  validate(RequestRescheduleSchema),
  catchAsync(bookingController.requestReschedule)
);
router.post(
  "/:id/reschedule-request",
  requireReviewer,
  validate(RequestRescheduleSchema),
  catchAsync(bookingController.requestReschedule)
);
router.patch(
  "/:id/status",
  requireReviewer,
  validate(MarkOutcomeSchema),
  catchAsync(bookingController.markOutcome)
);

export default router;