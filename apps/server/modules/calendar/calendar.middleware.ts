import type { Request, Response, NextFunction } from "express";

import { AppError } from "../../core/errors/AppError.js";
import { getGoogleCalendarStatusRepo } from "./calendar.repository.js";

// Reviewers must have Google Calendar connected before creating
// availability templates or event types, since every booking needs a
// Meet link generated through that calendar.
export const requireCalendarConnected = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== "reviewer") return next();

  const status = await getGoogleCalendarStatusRepo(req.user.userId);

  if (!status?.googleCalendarConnected) {
    throw new AppError(
      "Connect your Google Calendar before creating availability or event types.",
      403,
      { code: "CALENDAR_NOT_CONNECTED" }
    );
  }

  next();
};