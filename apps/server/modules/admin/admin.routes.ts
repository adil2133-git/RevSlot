import { Router } from "express";
import { adminController } from "./admin.controller.js";
import { validate, validateParams, validateQuery } from "../../core/middlewares/validate.middleware.js";
import { requireAdmin } from "../../core/middlewares/auth.middleware.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import {
  ListReviewersQuerySchema,
  ReviewerIdParamsSchema,
  UpdateReviewerStatusSchema,
  ListBookingsQuerySchema,
} from "./admin.schema.js";

const router = Router();

// Everything under /api/admin is admin-only.
router.use(requireAdmin);

router.get("/dashboard-stats", catchAsync(adminController.getDashboardStats));

router.get("/reviewers", validateQuery(ListReviewersQuerySchema), catchAsync(adminController.listReviewers));
router.patch(
  "/reviewers/:id",
  validateParams(ReviewerIdParamsSchema),
  validate(UpdateReviewerStatusSchema),
  catchAsync(adminController.updateReviewerStatus)
);

router.get("/bookings", validateQuery(ListBookingsQuerySchema), catchAsync(adminController.listBookings));

export default router;