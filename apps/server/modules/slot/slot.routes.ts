import { Router } from "express";
import { validate, validateQuery } from "../../core/middlewares/validate.middleware.js";
import { GetAvailableSlotsQuerySchema, HoldSlotSchema, ReleaseSlotSchema } from "./slot.validation.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import { slotController } from "./slot.controller.js";

const router = Router();

// Public — advisor booking page, no login needed
router.get("/available", validateQuery(GetAvailableSlotsQuerySchema), catchAsync(slotController.getAvailableSlots));

// Public — holds a slot while the advisor fills out the booking form
router.post(
  "/hold",
  validate(HoldSlotSchema),
  catchAsync(slotController.holdSlot)
);

// Public — advisor backed out of a hold (changed slot / closed tab);
// frees the row instead of leaving it stuck in the DB until expiry.
router.post(
  "/release",
  validate(ReleaseSlotSchema),
  catchAsync(slotController.releaseSlot)
);

export default router;