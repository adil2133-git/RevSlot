import { Router } from "express";

import { requireAuth, requireRole } from "../../core/middlewares/auth.middleware.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import { availabilityController } from "./availability.controller.js";

const router = Router();

// All availability routes require an authenticated reviewer
router.use(requireAuth, requireRole("reviewer"));

router.post("/", catchAsync(availabilityController.createTemplate));
router.get("/", catchAsync(availabilityController.listTemplates));
router.get("/:id", catchAsync(availabilityController.getTemplateById));
router.patch("/:id", catchAsync(availabilityController.updateTemplate));
router.delete("/:id", catchAsync(availabilityController.deleteTemplate));
router.put("/:id/time-blocks", catchAsync(availabilityController.replaceTimeBlocks));

export default router;