import type { Request, Response } from "express";
import { eventTypeService } from "./eventType.service.js";
import { BookingPageParamsSchema, ReviewerProfileParamsSchema } from "./eventType.schema.js";

export const eventTypeController = {
  getBookingPageInfo: async (req: Request, res: Response) => {
    const { username, eventSlug } = BookingPageParamsSchema.parse(req.params);
    const result = await eventTypeService.getBookingPageInfo(username, eventSlug);

    res.status(200).json({
      success: true,
      data: result,
    });
  },

    // Public — GET /event-types/:username → reviewer + their active event
  // types, for the profile-style "pick a session" page.
  getReviewerProfile: async (req: Request, res: Response) => {
    const { username } = ReviewerProfileParamsSchema.parse(req.params);
    const result = await eventTypeService.getReviewerProfile(username);

    res.status(200).json({
      success: true,
      data: result,
    });
  },

    createEventType: async (req: Request, res: Response) => {
    const data = req.body;

    const reviewerId = req.user!.userId;

    const eventType = await eventTypeService.createEventType(
      reviewerId,
      data
    );

    res.status(201).json({
      success: true,
      message: "Event type created successfully",
      data: eventType,
    });
  },

  getEventTypes: async (req: Request, res: Response) => {
    const reviewerId = req.user!.userId;

    const eventTypes = await eventTypeService.getEventTypes(
      reviewerId
    );

    res.status(200).json({
      success: true,
      data: eventTypes,
    });
  },

   getEventTypeById: async (req: Request, res: Response) => {
    const reviewerId = req.user!.userId;
    const eventTypeId = Number(req.params.id);

    const eventType =
      await eventTypeService.getEventTypeById(
        reviewerId,
        eventTypeId
      );

    res.status(200).json({
      success: true,
      data: eventType,
    });
  },

  updateEventType: async (req: Request, res: Response) => {
    const reviewerId = req.user!.userId;
    const eventTypeId = Number(req.params.id);

    const data = req.body;

    const eventType =
      await eventTypeService.updateEventType(
        reviewerId,
        eventTypeId,
        data
      );

    res.status(200).json({
      success: true,
      message: "Event type updated successfully",
      data: eventType,
    });
  },

  deactivateEventType: async (req: Request, res: Response) => {
    const reviewerId = req.user!.userId;
    const eventTypeId = Number(req.params.id);

    const eventType =
      await eventTypeService.deactivateEventType(
        reviewerId,
        eventTypeId
      );

    res.status(200).json({
      success: true,
      message: "Event type deactivated successfully",
      data: eventType,
    });
  },
};