import type { Request, Response } from "express";
import { calendarService, CLIENT_URL } from "./calendar.service.js";

export const calendarController = {
  // GET /api/calendar/google/connect
  getConnectUrl: async (req: Request, res: Response) => {
    const url = calendarService.getConnectUrl(req.user!.userId);

    res.status(200).json({
      success: true,
      data: { url },
    });
  },
 
  // GET /api/calendar/google/callback
  handleCallback: async (req: Request, res: Response) => {
    const {
      code,
      state,
      error,
    } = req.query as {
      code?: string;
      state?: string;
      error?: string;
    };

    if (error || !code || !state) {
      return res.redirect(`${CLIENT_URL}/dashboard?calendar=error`);
    }

    try {
      await calendarService.handleOAuthCallback(code, state);

      res.redirect(`${CLIENT_URL}/dashboard?calendar=connected`);
    } catch (err) {
      console.error(
        "[Calendar Controller] OAuth callback failed:",
        err
      );

      res.redirect(`${CLIENT_URL}/dashboard?calendar=error`);
    }
  },

  getStatus: async (req: Request, res: Response) => {
    const status = await calendarService.getStatus(req.user!.userId);

    res.status(200).json({
      success: true,
      data: status,
    });
  },

  disconnect: async (req: Request, res: Response) => {
    await calendarService.disconnect(req.user!.userId);

    res.status(200).json({
      success: true,
      message: "Google Calendar disconnected",
    });
  },
};