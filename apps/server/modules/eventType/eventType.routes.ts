import { Router } from "express";
import { validateParams } from "../../core/middlewares/validate.middleware.js";
import { BookingPageParamsSchema } from "./eventType.schema.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import { eventTypeController } from "./eventType.controller.js";

const router = Router();

// Public — used by the booking page to load reviewer + event type info
router.get(
  "/:reviewerId/:eventSlug",
  validateParams(BookingPageParamsSchema),
  catchAsync(eventTypeController.getBookingPageInfo)
);

export default router;