import type { Request, Response } from "express";
import { disputeService } from "./dispute.service.js";
import { AppError } from "../../core/errors/AppError.js";

export const disputeController = {
  reportDispute: async (req: Request, res: Response) => {
    const bookingId = Number(req.params.bookingId || req.body.bookingId);
    const { advisorEmail, reason, description } = req.body;

    if (!bookingId || isNaN(bookingId)) {
      throw new AppError("A valid booking ID is required", 400);
    }
    if (!advisorEmail || !reason || !description) {
      throw new AppError("Advisor email, reason, and description are required", 400);
    }

    const dispute = await disputeService.reportDispute(bookingId, advisorEmail, {
      reason,
      description,
    });

    return res.status(201).json({
      status: "success",
      message: "Issue reported successfully. Escrow funds have been frozen while our team investigates.",
      data: dispute,
    });
  },

  getBookingDispute: async (req: Request, res: Response) => {
    const bookingId = Number(req.params.bookingId);
    const advisorEmail = String(req.query.advisorEmail || "");

    if (!bookingId || !advisorEmail) {
      throw new AppError("Booking ID and advisor email are required", 400);
    }

    const dispute = await disputeService.getDisputeForBooking(bookingId, advisorEmail);
    return res.json({
      status: "success",
      data: dispute,
    });
  },

  listAdminDisputes: async (req: Request, res: Response) => {
    const status = req.query.status as any;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result = await disputeService.listAdminDisputes({ status, page, limit });
    return res.json({
      status: "success",
      data: result,
    });
  },

  resolveAdminDispute: async (req: Request, res: Response) => {
    const disputeId = Number(req.params.id);
    const adminId = (req as any).user?.id || 1;
    const { action, adminNotes } = req.body;

    if (!disputeId || isNaN(disputeId)) {
      throw new AppError("Valid dispute ID is required", 400);
    }
    if (action !== "refund_client" && action !== "dismiss") {
      throw new AppError("Action must be 'refund_client' or 'dismiss'", 400);
    }

    const resolved = await disputeService.adminResolveDispute(disputeId, adminId, {
      action,
      adminNotes,
    });

    return res.json({
      status: "success",
      message: action === "refund_client" ? "100% refund initiated to client" : "Dispute dismissed; escrow released",
      data: resolved,
    });
  },
};
