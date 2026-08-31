import { Router } from "express";
import { adminController } from "./admin.controller.js";
import { auditLogController } from "../auditLog/auditLog.controller.js";
import { validate, validateParams, validateQuery } from "../../core/middlewares/validate.middleware.js";
import { requireAdmin } from "../../core/middlewares/auth.middleware.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import {
  ListReviewersQuerySchema,
  ReviewerIdParamsSchema,
  UpdateReviewerStatusSchema,
  ListBookingsQuerySchema,
  UpdateAdminProfileSchema,
} from "./admin.schema.js";
import { ListAuditLogQuerySchema } from "../auditLog/auditLog.schema.js";

const router = Router();

// Everything under /api/admin is admin-only.
router.use(requireAdmin);

router.get("/me", catchAsync(adminController.getProfile));
router.patch("/me", validate(UpdateAdminProfileSchema), catchAsync(adminController.updateProfile));

router.get("/dashboard-stats", catchAsync(adminController.getDashboardStats));

router.get("/reviewers", validateQuery(ListReviewersQuerySchema), catchAsync(adminController.listReviewers));
router.patch(
  "/reviewers/:id",
  validateParams(ReviewerIdParamsSchema),
  validate(UpdateReviewerStatusSchema),
  catchAsync(adminController.updateReviewerStatus)
);

router.get("/bookings", validateQuery(ListBookingsQuerySchema), catchAsync(adminController.listBookings));

router.get("/audit-log", validateQuery(ListAuditLogQuerySchema), catchAsync(auditLogController.listAuditLogs));

export default router;