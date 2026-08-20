import { Router } from "express";

import { validate } from "../../core/middlewares/validate.middleware.js";
import { requireReviewer } from "../../core/middlewares/auth.middleware.js";
import { catchAsync } from "../../core/utils/catchAsync.js";

import {
  CreateTemplateSchema,
  UpdateTemplateSchema,
  ReplaceTimeBlocksSchema,
  CreateDateOverrideSchema
} from "./availability.schema.js";
import { availabilityController } from "./availability.controller.js";

const router = Router();

router.use(requireReviewer);

router.post("/", validate(CreateTemplateSchema), catchAsync(availabilityController.createTemplate));
router.get("/", catchAsync(availabilityController.listTemplates));
router.get("/meta/timezones", catchAsync(availabilityController.getTimezoneOptions));
router.get("/meta/time-options", catchAsync(availabilityController.getTimeOptions));
router.get("/:id", catchAsync(availabilityController.getTemplateById));
router.patch("/:id", validate(UpdateTemplateSchema), catchAsync(availabilityController.updateTemplate));
router.delete("/:id", catchAsync(availabilityController.deleteTemplate));
router.put("/:id/time-blocks", validate(ReplaceTimeBlocksSchema), catchAsync(availabilityController.replaceTimeBlocks));
router.post("/:id/date-overrides", validate(CreateDateOverrideSchema), catchAsync(availabilityController.createDateOverride));
router.get("/:id/date-overrides", catchAsync(availabilityController.listDateOverrides));
router.delete("/:id/date-overrides/:overrideId", catchAsync(availabilityController.deleteDateOverride));

export default router;