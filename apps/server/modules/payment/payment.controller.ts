import type { Request, Response } from "express";
import { paymentService } from "./payment.service.js";

export const paymentController = {
  createOrder: async (req: Request, res: Response) => {
    const result = await paymentService.createOrder(req.body.holdToken);
    res.status(200).json({ success: true, data: result });
  },
};