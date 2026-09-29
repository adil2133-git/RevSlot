import { AppError } from "../../core/errors/AppError.js";
import type { CreateEventTypeInput, UpdateEventTypeInput } from "./eventType.validation.js";
import {
  findPublicReviewerByUsernameRepo,
  findBookingPageEventTypeRepo,
  findProfileReviewerByUsernameRepo,
  findPublicActiveEventTypesByReviewerRepo,
  findReviewerWhatsAppRepo,
  findOwnedTemplateIdRepo,
  findEventTypeBySlugAndReviewerRepo,
  insertEventTypeRepo,
  findEventTypesByReviewerRepo,
  findEventTypeByIdAndReviewerRepo,
  findEventTypeIdOwnedRepo,
  updateEventTypeRepo,
  findEventTypeActiveStatusRepo,
  deactivateEventTypeRepo,
} from "./eventType.repository.js";

export const eventTypeService = {
  // Public lookup for the booking page — given a username and an event
  // type slug, returns just the fields safe to show publicly (no email,
  // no internal IDs beyond what's needed to call the slots/booking APIs).
  getBookingPageInfo: async (username: string, eventSlug: string) => {
    const reviewer = await findPublicReviewerByUsernameRepo(username);

    if (!reviewer) {
      throw new AppError("Reviewer not found", 404);
    }

    // Timezone lives on the availability template (Doc 5.2: "Availability
    // Template: 9:00 AM – 12:00 PM (Asia/Kolkata)"), not on the reviewer or
    // event type directly — join it in so the booking page can show it and
    // the client can do timezone-aware slot display later.
    const eventType = await findBookingPageEventTypeRepo(reviewer.id, eventSlug);

    if (!eventType) {
      throw new AppError("Event type not found", 404);
    }

    return {
      reviewer,
      eventType,
    };
  },

  // Public lookup for the profile page — given just a username, returns
  // the reviewer plus every active event type they offer, so a visitor
  // can pick which one to book (e.g. /shibin-tharthees → list of cards,
  // same idea as cal.com/{username}).
  getReviewerProfile: async (username: string) => {
    const reviewer = await findProfileReviewerByUsernameRepo(username);

    if (!reviewer) {
      throw new AppError("Reviewer not found", 404);
    }

    // Public-safe fields only — same subset as getBookingPageInfo, no
    // internal ids (availabilityTemplateId), buffers, or meeting links.
    const activeEventTypes = await findPublicActiveEventTypesByReviewerRepo(reviewer.id);

    return { reviewer, eventTypes: activeEventTypes };
  },

  createEventType: async (
    reviewerId: number,
    data: CreateEventTypeInput
  ) => {
    // Check whether reviewer has a WhatsApp number set
    const reviewer = await findReviewerWhatsAppRepo(reviewerId);

    if (!reviewer?.whatsappNumber || reviewer.whatsappNumber.trim().length === 0) {
      throw new AppError(
        "WhatsApp number is required before creating an event type. Please add your WhatsApp number in your profile.",
        400
      );
    }

    // 1. Check whether the availability template belongs
    //    to the authenticated reviewer
    const template = await findOwnedTemplateIdRepo(data.availabilityTemplateId, reviewerId);

    if (!template) {
      throw new AppError(
        "Availability template not found for this reviewer",
        404
      );
    }

    // 2. Generate slug from event name
    const slug = data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!slug) {
      throw new AppError(
        "Event name must contain at least one letter or number",
        400
      );
    }

    // Check whether this reviewer already has
    // an event type with the same slug
    const existingEventType = await findEventTypeBySlugAndReviewerRepo(slug, reviewerId);

    if (existingEventType) {
      throw new AppError(
        "An event type with this name already exists",
        409
      );
    }

    // 4. Create the event type
    const eventType = await insertEventTypeRepo({
      reviewerId,
      availabilityTemplateId: data.availabilityTemplateId,
      name: data.name,
      slug,
      description: data.description,
      durationMinutes: data.durationMinutes,
      price: data.price,
      bufferBeforeMinutes: data.bufferBeforeMinutes,
      bufferAfterMinutes: data.bufferAfterMinutes,
      meetingLink: data.meetingLink,
      isPublic: data.isPublic,
    });

    return eventType;
  },

  getEventTypes: async (reviewerId: number) => {
    return await findEventTypesByReviewerRepo(reviewerId);
  },

  getEventTypeById: async (
    reviewerId: number,
    eventTypeId: number
  ) => {
    const eventType = await findEventTypeByIdAndReviewerRepo(eventTypeId, reviewerId);

    if (!eventType) {
      throw new AppError("Event type not found", 404);
    }

    return eventType;
  },

  updateEventType: async (
    reviewerId: number,
    eventTypeId: number,
    data: UpdateEventTypeInput
  ) => {
    // 1. Check whether the event type belongs to
    //    the authenticated reviewer
    const existingEventType = await findEventTypeIdOwnedRepo(eventTypeId, reviewerId);

    if (!existingEventType) {
      throw new AppError("Event type not found", 404);
    }

    // 2. If availability template is being changed,
    //    make sure the new template belongs to this reviewer
    if (data.availabilityTemplateId !== undefined) {
      const template = await findOwnedTemplateIdRepo(data.availabilityTemplateId, reviewerId);

      if (!template) {
        throw new AppError("Availability template not found for this reviewer", 404);
      }
    }

    // 3. Update only the fields supplied by the reviewer.
    //    Slug is intentionally NOT updated.
    const updatedEventType = await updateEventTypeRepo(eventTypeId, reviewerId, data);

    return updatedEventType;
  },

  deactivateEventType: async (
    reviewerId: number,
    eventTypeId: number
  ) => {
    // Make sure this event type belongs to
    // the authenticated reviewer
    const eventType = await findEventTypeActiveStatusRepo(eventTypeId, reviewerId);

    if (!eventType) {
      throw new AppError("Event type not found", 404);
    }

    // Already inactive
    if (!eventType.isActive) {
      throw new AppError("Event type is already inactive", 400);
    }

    const updatedEventType = await deactivateEventTypeRepo(eventTypeId, reviewerId);

    return updatedEventType;
  },
};