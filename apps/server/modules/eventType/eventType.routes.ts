import { Router } from "express";
import { validate, validateParams } from "../../core/middlewares/validate.middleware.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import { eventTypeController } from "./eventType.controller.js";
import { requireAuth } from "../../core/middlewares/auth.middleware.js"
import { BookingPageParamsSchema, ReviewerProfileParamsSchema, CreateEventTypeSchema, UpdateEventTypeSchema } from "./eventType.schema.js";

const router = Router();

// Public — used by the booking page to load reviewer + event type info
router.get("/:username/:eventSlug", validateParams(BookingPageParamsSchema), catchAsync(eventTypeController.getBookingPageInfo));

// Protected — Event Type management
router.post("/", requireAuth,  validate(CreateEventTypeSchema), catchAsync(eventTypeController.createEventType));
router.get("/", requireAuth, catchAsync(eventTypeController.getEventTypes));
// router.get("/:id", requireAuth, catchAsync(eventTypeController.getEventTypeById));
// router.patch("/:id", requireAuth, validate(UpdateEventTypeSchema), catchAsync(eventTypeController.updateEventType));
// router.delete("/:id", requireAuth, catchAsync(eventTypeController.deactivateEventType));
// GET /:id (protected, numeric) and GET /:username (public, profile page)
// are both single-segment routes, so Express can't tell them apart by
// path shape alone. This guard checks the segment BEFORE requireAuth
// runs: numeric → treat as an id and continue down this route; anything
// else → skip this route entirely (via next()) so Express falls through
// to the public /:username route below instead of rejecting it with 401.
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