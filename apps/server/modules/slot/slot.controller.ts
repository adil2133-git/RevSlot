import type { Request, Response } from "express";
import { slotService } from "./slot.service.js";
import type { GetAvailableSlotsQuery, HoldSlotInput } from "./slot.schema.js"

export const slotController = {

  getAvailableSlots: async (req: Request, res: Response) => {
    const { eventTypeId, dateFrom, dateTo } = res.locals.query as GetAvailableSlotsQuery;

    const result = await slotService.getAvailableSlots(
        eventTypeId,
        dateFrom,
        dateTo
    ); 

    res.status(200).json({
      success: true,
      data: result,
    });
  },

  holdSlot: async (req: Request, res: Response) => {
    const result = await slotService.holdSlot(req.body as HoldSlotInput)
    res.status(200).json({
      success: true,
      data: result,
    });
  },
};