import { Router } from "express";
import { disputeController } from "./dispute.controller.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import { requireAdmin } from "../../core/middlewares/auth.middleware.js";

const router = Router();

// Client / Advisor routes (public / token-verified by email)
router.post("/report", catchAsync(disputeController.reportDispute));
router.get("/booking/:bookingId", catchAsync(disputeController.getBookingDispute));

// Admin routes
router.get("/admin", requireAdmin, catchAsync(disputeController.listAdminDisputes));
router.patch("/admin/:id/resolve", requireAdmin, catchAsync(disputeController.resolveAdminDispute));

export default router;
