import { Router } from "express";
import { validate } from "../../core/middlewares/validate.middleware.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import { paymentController } from "./payment.controller.js";
import { CreateOrderSchema, VerifyPaymentSchema } from "./payment.validation.js";
import { bookingController } from "../booking/booking.controller.js";

const router = Router();

// Public — booking page calls this right before opening Razorpay Checkout
router.post("/create-order", validate(CreateOrderSchema), catchAsync(paymentController.createOrder));

// Public — after Checkout succeeds. Deliberately reuses
// bookingController.createBooking (same code path free bookings use) —
// the signature check lives inside bookingService.createBooking itself.
router.post("/verify", validate(VerifyPaymentSchema), catchAsync(bookingController.createBooking));

export default router;