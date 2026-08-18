import { Router } from "express";
import { validate } from "../../core/middlewares/validate.middleware.js";
import { CreateBookingSchema } from "./booking.schema.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import { bookingController } from "./booking.controller.js";

const router = Router();

router.post(
  "/",
  validate(CreateBookingSchema),
  catchAsync(bookingController.createBooking)
);

export default router;