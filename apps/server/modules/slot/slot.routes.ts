import { Router } from "express";
import { validate } from "../../core/middlewares/validate.middleware.js";
import { GenerateSlotsSchema } from "./slot.schema.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import { slotController } from "./slot.controller.js";
import { requireAuth } from "../../core/middlewares/auth.middleware.js";

const router = Router();

// Reviewer login pannirukanum, slots generate panna (protected)
router.post("/generate", requireAuth, validate(GenerateSlotsSchema), catchAsync(slotController.generateSlots)
);
// Public — advisor booking page ku, login venaam
router.get("/available", catchAsync(slotController.getAvailableSlots));

export default router;