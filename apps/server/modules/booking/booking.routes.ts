import { Router } from "express";
import { validate, validateQuery } from "../../core/middlewares/validate.middleware.js";
import { requireReviewer } from "../../core/middlewares/auth.middleware.js";
import {
  CreateBookingSchema,
  GetMyBookingsQuerySchema,
  CancelBookingSchema,
  RescheduleBookingSchema,
} from "./booking.validation.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import { bookingController } from "./booking.controller.js";

const router = Router();

router.post(
  "/",
  validate(CreateBookingSchema),
  catchAsync(bookingController.createBooking)
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
  validate(RescheduleBookingSchema),
  catchAsync(bookingController.rescheduleBooking)
);

export default router;