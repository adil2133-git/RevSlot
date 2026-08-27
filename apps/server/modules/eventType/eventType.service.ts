import { eq, and, desc } from "drizzle-orm";
import { db } from "../../config/db.js";
import { reviewers } from "../auth/reviewers.model.js";
import { eventTypes } from "./eventTypes.model.js";
import { availabilityTemplates } from "../availability/availabilityTemplates.model.js";
import { AppError } from "../../core/errors/AppError.js";

import type { CreateEventTypeInput, UpdateEventTypeInput } from "./eventType.schema.js";

export const eventTypeService = {
  // Public lookup for the booking page — given a username and an event
  // type slug, returns just the fields safe to show publicly (no email,
  // no internal IDs beyond what's needed to call the slots/booking APIs).
  getBookingPageInfo: async (username: string, eventSlug: string) => {
    const [reviewer] = await db
      .select({
        id: reviewers.id,
        name: reviewers.name,
        avatarUrl: reviewers.avatarUrl,
        bio: reviewers.bio,
      })
      .from(reviewers)
      .where(and(eq(reviewers.username, username), eq(reviewers.isActive, true)))
      .limit(1);

    if (!reviewer) {
      throw new AppError("Reviewer not found", 404);
    }

    // Timezone lives on the availability template (Doc 5.2: "Availability
    // Template: 9:00 AM – 12:00 PM (Asia/Kolkata)"), not on the reviewer or
    // event type directly — join it in so the booking page can show it and
    // the client can do timezone-aware slot display later.
    const [eventType] = await db
      .select({
        id: eventTypes.id,
        name: eventTypes.name,
        slug: eventTypes.slug,
        durationMinutes: eventTypes.durationMinutes,
        description: eventTypes.description,
        timezone: availabilityTemplates.timezone,
        bookingWindowDays: eventTypes.bookingWindowDays,
      })
      .from(eventTypes)
      .innerJoin(
        availabilityTemplates,
        eq(eventTypes.availabilityTemplateId, availabilityTemplates.id)
      )
      .where(
        and(
          eq(eventTypes.reviewerId, reviewer.id),
          eq(eventTypes.slug, eventSlug),
          eq(eventTypes.isActive, true)
        )
      )
      .limit(1);

    if (!eventType) {
      throw new AppError("Event type not found", 404);
    }

    return { reviewer, eventType };
  },

   
  // Public lookup for the profile page — given just a username, returns
  // the reviewer plus every active event type they offer, so a visitor
  // can pick which one to book (e.g. /shibin-tharthees → list of cards,
  // same idea as cal.com/{username}).
  getReviewerProfile: async (username: string) => {
    const [reviewer] = await db
      .select({
        id: reviewers.id,
        name: reviewers.name,
        avatarUrl: reviewers.avatarUrl,
        bio: reviewers.bio,
      })
      .from(reviewers)
      .where(and(eq(reviewers.username, username), eq(reviewers.isActive, true)))
      .limit(1);

    if (!reviewer) {
      throw new AppError("Reviewer not found", 404);
    }

    // Public-safe fields only — same subset as getBookingPageInfo, no
    // internal ids (availabilityTemplateId), buffers, or meeting links.
    const activeEventTypes = await db
      .select({
        id: eventTypes.id,
        name: eventTypes.name,
        slug: eventTypes.slug,
        description: eventTypes.description,
        durationMinutes: eventTypes.durationMinutes,
        price: eventTypes.price,
      })
      .from(eventTypes)
      .where(and(eq(eventTypes.reviewerId, reviewer.id), eq(eventTypes.isActive, true)))
      .orderBy(desc(eventTypes.createdAt));

    return { reviewer, eventTypes: activeEventTypes };
  },

  createEventType: async (
  reviewerId: number,
  data: CreateEventTypeInput
) => {
  // 1. Check whether the availability template belongs
  //    to the authenticated reviewer
  const [template] = await db
    .select({
      id: availabilityTemplates.id,
    })
    .from(availabilityTemplates)
    .where(
      and(
        eq(availabilityTemplates.id, data.availabilityTemplateId),
        eq(availabilityTemplates.reviewerId, reviewerId)
      )
    )
    .limit(1);

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

  // 3. Check whether this reviewer already has
  //    an event type with the same slug
  const [existingEventType] = await db
    .select({
      id: eventTypes.id,
    })
    .from(eventTypes)
    .where(
      and(
        eq(eventTypes.reviewerId, reviewerId),
        eq(eventTypes.slug, slug)
      )
    )
    .limit(1);

  if (existingEventType) {
    throw new AppError(
      "An event type with this name already exists",
      409
    );
  }

  // 4. Create the event type
  const [eventType] = await db
    .insert(eventTypes)
    .values({
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
    })
    .returning();

  return eventType;
},

  getEventTypes: async (reviewerId: number) => {
  const eventTypeList = await db
    .select({
      id: eventTypes.id,
      availabilityTemplateId: eventTypes.availabilityTemplateId,
      name: eventTypes.name,
      slug: eventTypes.slug,
      description: eventTypes.description,
      durationMinutes: eventTypes.durationMinutes,
      price: eventTypes.price,
      bufferBeforeMinutes: eventTypes.bufferBeforeMinutes,
      bufferAfterMinutes: eventTypes.bufferAfterMinutes,
      meetingLink: eventTypes.meetingLink,
      isActive: eventTypes.isActive,
      createdAt: eventTypes.createdAt,
      updatedAt: eventTypes.updatedAt,
    })
    .from(eventTypes)
    .where(eq(eventTypes.reviewerId, reviewerId))
    .orderBy(desc(eventTypes.createdAt));

  return eventTypeList;
},

  getEventTypeById: async (
  reviewerId: number,
  eventTypeId: number
) => {
  const [eventType] = await db
    .select({
      id: eventTypes.id,
      reviewerId: eventTypes.reviewerId,
      availabilityTemplateId: eventTypes.availabilityTemplateId,
      name: eventTypes.name,
      slug: eventTypes.slug,
      description: eventTypes.description,
      durationMinutes: eventTypes.durationMinutes,
      price: eventTypes.price,
      bufferBeforeMinutes: eventTypes.bufferBeforeMinutes,
      bufferAfterMinutes: eventTypes.bufferAfterMinutes,
      meetingLink: eventTypes.meetingLink,
      isActive: eventTypes.isActive,
      createdAt: eventTypes.createdAt,
      updatedAt: eventTypes.updatedAt,
    })
    .from(eventTypes)
    .where(
      and(
        eq(eventTypes.id, eventTypeId),
        eq(eventTypes.reviewerId, reviewerId)
      )
    )
    .limit(1);

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
  const [existingEventType] = await db
    .select({
      id: eventTypes.id,
    })
    .from(eventTypes)
    .where(
      and(
        eq(eventTypes.id, eventTypeId),
        eq(eventTypes.reviewerId, reviewerId)
      )
    )
    .limit(1);

  if (!existingEventType) {
    throw new AppError("Event type not found", 404);
  }

  // 2. If availability template is being changed,
  //    make sure the new template belongs to this reviewer
  if (data.availabilityTemplateId !== undefined) {
    const [template] = await db
      .select({
        id: availabilityTemplates.id,
      })
      .from(availabilityTemplates)
      .where(
        and(
          eq(
            availabilityTemplates.id,
            data.availabilityTemplateId
          ),
          eq(
            availabilityTemplates.reviewerId,
            reviewerId
          )
        )
      )
      .limit(1);

    if (!template) {
      throw new AppError(
        "Availability template not found for this reviewer",
        404
      );
    }
  }

  // 3. Update only the fields supplied by the reviewer.
  //    Slug is intentionally NOT updated.
  const [updatedEventType] = await db
    .update(eventTypes)
    .set({
      ...(data.availabilityTemplateId !== undefined && {
        availabilityTemplateId: data.availabilityTemplateId,
      }),

      ...(data.name !== undefined && {
        name: data.name,
      }),

      ...(data.description !== undefined && {
        description: data.description,
      }),

      ...(data.durationMinutes !== undefined && {
        durationMinutes: data.durationMinutes,
      }),

      ...(data.price !== undefined && {
        price: data.price,
      }),

      ...(data.bufferBeforeMinutes !== undefined && {
        bufferBeforeMinutes: data.bufferBeforeMinutes,
      }),

      ...(data.bufferAfterMinutes !== undefined && {
        bufferAfterMinutes: data.bufferAfterMinutes,
      }),

      ...(data.meetingLink !== undefined && {
        meetingLink: data.meetingLink,
      }),

      ...(data.isActive !== undefined && {
        isActive: data.isActive,
      }),

      updatedAt: new Date(),
    })
    .where(
      and(
        eq(eventTypes.id, eventTypeId),
        eq(eventTypes.reviewerId, reviewerId)
      )
    )
    .returning();

  return updatedEventType;
},

  deactivateEventType: async (
  reviewerId: number,
  eventTypeId: number
) => {
  // Make sure this event type belongs to
  // the authenticated reviewer
  const [eventType] = await db
    .select({
      id: eventTypes.id,
      isActive: eventTypes.isActive,
    })
    .from(eventTypes)
    .where(
      and(
        eq(eventTypes.id, eventTypeId),
        eq(eventTypes.reviewerId, reviewerId)
      )
    )
    .limit(1);

  if (!eventType) {
    throw new AppError("Event type not found", 404);
  }

  // Already inactive
  if (!eventType.isActive) {
    throw new AppError("Event type is already inactive", 400);
  }

  const [updatedEventType] = await db
    .update(eventTypes)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(eventTypes.id, eventTypeId),
        eq(eventTypes.reviewerId, reviewerId)
      )
    )
    .returning();

  return updatedEventType;
},

};