import { Router } from "express";

import { validate } from "../../core/middlewares/validate.middleware.js";
import { requireReviewer } from "../../core/middlewares/auth.middleware.js";
import { catchAsync } from "../../core/utils/catchAsync.js";

import { CreateVacationBlockSchema, UpdateVacationBlockSchema } from "./vacation.schema.js";
import { vacationController } from "./vacation.controller.js";

const router = Router();

// All vacation routes require a logged-in reviewer
router.use(requireReviewer);

// Create a new vacation block
router.post("/", validate(CreateVacationBlockSchema), catchAsync(vacationController.createVacationBlock));
// List all vacation blocks for the reviewer
router.get("/", catchAsync(vacationController.listVacationBlocks));
// Get a single vacation block
router.get("/:id", catchAsync(vacationController.getVacationBlockById));
// Update a vacation block
router.patch("/:id", validate(UpdateVacationBlockSchema), catchAsync(vacationController.updateVacationBlock));
// Delete a vacation block
router.delete("/:id", catchAsync(vacationController.deleteVacationBlock));

export default router;