import type { Request, Response } from "express";

import { meetingService } from "./meeting.service.js";
import {
  BookingIdParamSchema,
  MeetingTokenSchema,
} from "./meeting.validation.js";

const bookingId = (req: Request) =>
  BookingIdParamSchema.parse(req.params).bookingId;

export const meetingController = {
  getInfo: async (req: Request, res: Response) => {
    const id = bookingId(req);
    const { token } = MeetingTokenSchema.parse(req.query);

    const booking = await meetingService.validateAccess(id, token);

    res.json({
      success: true,
      data: {
        bookingId: booking.id,
        eventTypeName: booking.eventTypeName,
        reviewerName: booking.reviewerName,
        advisorName: booking.advisorName,
        internName: booking.internName,
        startTime: booking.startTime,
        endTime: booking.endTime,
      },
    });
  },
};
