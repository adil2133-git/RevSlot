import { Router } from "express";
import { validate, validateParams } from "../../core/middlewares/validate.middleware.js";
import { GenerateSlotsSchema, HoldSlotParamsSchema } from "./slot.schema.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import { slotController } from "./slot.controller.js";
import { requireAuth } from "../../core/middlewares/auth.middleware.js";

const router = Router();

// Reviewer must be logged in to generate slots (protected)
router.post(
  "/generate",
//   requireAuth,
  validate(GenerateSlotsSchema),
  catchAsync(slotController.generateSlots)
);

// Public — advisor booking page, no login needed
router.get("/available", catchAsync(slotController.getAvailableSlots));

// Public — holds a slot while the advisor fills out the booking form
router.post(
  "/:id/hold",
  validateParams(HoldSlotParamsSchema),
  catchAsync(slotController.holdSlot)
);

export default router;