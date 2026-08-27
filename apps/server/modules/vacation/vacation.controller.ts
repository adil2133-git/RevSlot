import type { Request, Response } from "express";
import { vacationService } from "./vacation.service.js";
import { AppError } from "../../core/errors/AppError.js";

// Converts and validates the :id route param into a positive integer
const parseBlockId = (raw: string | string[] | undefined): number => {
  if (Array.isArray(raw)) {
    throw new AppError("Invalid vacation block id", 400);
  }
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid vacation block id", 400);
  }
  return id;
};

export const vacationController = {
  // Handles POST / — creates a new vacation block, may return 409 with affected bookings
  createVacationBlock: async (req: Request, res: Response) => {
    const block = await vacationService.createVacationBlock(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: { vacationBlock: block } });
  },

  // Handles GET / — lists all vacation blocks for the logged-in reviewer
  listVacationBlocks: async (req: Request, res: Response) => {
    const blocks = await vacationService.listVacationBlocks(req.user!.userId);
    res.status(200).json({ success: true, data: { vacationBlocks: blocks } });
  },

  // Handles GET /:id — fetches a single vacation block
  getVacationBlockById: async (req: Request, res: Response) => {
    const blockId = parseBlockId(req.params.id);
    const block = await vacationService.getVacationBlockById(req.user!.userId, blockId);
    res.status(200).json({ success: true, data: { vacationBlock: block } });
  },

  // Handles PATCH /:id — updates a vacation block, may return 409 with newly affected bookings
  updateVacationBlock: async (req: Request, res: Response) => {
    const blockId = parseBlockId(req.params.id);
    const block = await vacationService.updateVacationBlock(req.user!.userId, blockId, req.body);
    res.status(200).json({ success: true, data: { vacationBlock: block } });
  },

  // Handles DELETE /:id — deletes a vacation block
  deleteVacationBlock: async (req: Request, res: Response) => {
    const blockId = parseBlockId(req.params.id);
    await vacationService.deleteVacationBlock(req.user!.userId, blockId);
    res.status(200).json({ success: true, message: "Vacation block deleted" });
  },
};