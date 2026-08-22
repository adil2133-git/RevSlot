import { Router } from "express";
import { validate, validateParams } from "../../core/middlewares/validate.middleware.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import { eventTypeController } from "./eventType.controller.js";
import { requireAuth } from "../../core/middlewares/auth.middleware.js"
import { BookingPageParamsSchema, CreateEventTypeSchema, UpdateEventTypeSchema } from "./eventType.schema.js";

const router = Router();

// Public — used by the booking page to load reviewer + event type info
router.get("/:username/:eventSlug", validateParams(BookingPageParamsSchema), catchAsync(eventTypeController.getBookingPageInfo));

// Protected — Event Type management
router.post("/", requireAuth,  validate(CreateEventTypeSchema), catchAsync(eventTypeController.createEventType));
router.get("/", requireAuth, catchAsync(eventTypeController.getEventTypes));
router.get("/:id", requireAuth, catchAsync(eventTypeController.getEventTypeById));
router.patch("/:id", requireAuth, validate(UpdateEventTypeSchema), catchAsync(eventTypeController.updateEventType));
router.delete("/:id", requireAuth, catchAsync(eventTypeController.deactivateEventType));

export default router;