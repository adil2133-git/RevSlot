import { Router } from "express";
import { validateQuery } from "../../core/middlewares/validate.middleware.js";
import { requireReviewer } from "../../core/middlewares/auth.middleware.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import { dashboardController } from "./dashboard.controller.js";
import { GetDashboardSummaryQuerySchema } from "./dashboard.validation.js";

const router = Router();

// GET /api/dashboard/summary - Reviewer dashboard metrics, alerts, schedule, activity feed
router.get(
  "/summary",
  requireReviewer,
  validateQuery(GetDashboardSummaryQuerySchema),
  catchAsync(dashboardController.getSummary)
);

// GET /api/dashboard/reference-questions/:bookingId - Evaluation reference questions for a booking
router.get(
  "/reference-questions/:bookingId",
  requireReviewer,
  catchAsync(dashboardController.getReferenceQuestions)
);

export default router;
