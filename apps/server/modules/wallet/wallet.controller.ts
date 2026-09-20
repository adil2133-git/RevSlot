import type { Request, Response } from "express";
import { walletService } from "./wallet.service.js";

export const walletController = {
  getOverview: async (req: Request, res: Response) => {
    const reviewerId = req.user!.userId;
    const result = await walletService.getWalletOverview(reviewerId);
    res.status(200).json({ success: true, data: result });
  },

  savePayoutProfile: async (req: Request, res: Response) => {
    const reviewerId = req.user!.userId;
    const result = await walletService.savePayoutProfile(reviewerId, req.body);
    res.status(200).json({ success: true, data: result });
  },

  requestPayout: async (req: Request, res: Response) => {
    const reviewerId = req.user!.userId;
    const { amountPaise } = req.body;
    const result = await walletService.requestPayout(reviewerId, Number(amountPaise));
    res.status(200).json({ success: true, data: result });
  },
};
