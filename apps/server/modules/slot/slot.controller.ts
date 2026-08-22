import type { Request, Response } from "express";
import { slotService } from "./slot.service.js";

export const slotController = {
  generateSlots: async (req: Request, res: Response) => {
    const result = await slotService.generateSlots(req.body, req.user!.userId);

    res.status(201).json({
      success: true,
      data: result,
    });
  },

  getAvailableSlots: async (req: Request, res: Response) => {
    const { eventTypeId, dateFrom, dateTo } = req.query;

    const result = await slotService.getAvailableSlots(
      Number(eventTypeId),
      String(dateFrom),
      String(dateTo)
    ); 

    res.status(200).json({
      success: true,
      data: result,
    });
  },

  holdSlot: async (req: Request, res: Response) => {
    const slotId = Number(req.params.id);

    const result = await slotService.holdSlot(slotId);

    res.status(200).json({
      success: true,
      data: result,
    });
  },
};