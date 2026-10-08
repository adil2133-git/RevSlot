import { Router } from "express";
import { validate, validateParams } from "../../core/middlewares/validate.middleware.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import { eventTypeController } from "./eventType.controller.js";
import { requireAuth } from "../../core/middlewares/auth.middleware.js"
import { BookingPageParamsSchema, ReviewerProfileParamsSchema, CreateEventTypeSchema, UpdateEventTypeSchema } from "./eventType.validation.js";
import { requireCalendarConnected } from "../calendar/calendar.middleware.js";

const router = Router();

// Public — used by the booking page to load reviewer + event type info
router.get("/:username/:eventSlug", validateParams(BookingPageParamsSchema), catchAsync(eventTypeController.getBookingPageInfo));

// Protected — Event Type management
router.post("/", requireAuth, catchAsync(requireCalendarConnected), validate(CreateEventTypeSchema), catchAsync(eventTypeController.createEventType));
router.get("/", requireAuth, catchAsync(eventTypeController.getEventTypes));

const numericIdOnly = (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
  const idParam = req.params.id;
  if (typeof idParam !== "string" || !/^\d+$/.test(idParam)) return next("route");
  next();
};

router.get("/:id", numericIdOnly, requireAuth, catchAsync(eventTypeController.getEventTypeById));
router.patch("/:id", numericIdOnly, requireAuth, validate(UpdateEventTypeSchema), catchAsync(eventTypeController.updateEventType));
router.delete("/:id", numericIdOnly, requireAuth, catchAsync(eventTypeController.deactivateEventType));

// Public — profile page: reviewer + their active event types (cal.com/{username}-style)
router.get("/:username", validateParams(ReviewerProfileParamsSchema), catchAsync(eventTypeController.getReviewerProfile));

export default router;