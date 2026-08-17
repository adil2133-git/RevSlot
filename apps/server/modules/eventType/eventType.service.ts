// import { eq, and } from "drizzle-orm";
// import { db } from "../../config/db.js";
// import { reviewers } from "../../db/schema/reviewers.js";
// import { eventTypes } from "../../db/schema/eventTypes.js";
// import { AppError } from "../../core/errors/AppError.js";

// export const eventTypeService = {
//   // Public lookup for the booking page — given a reviewerId and an event
//   // type slug, returns just the fields safe to show publicly (no email,
//   // no internal IDs beyond what's needed to call the slots/booking APIs).
//   getBookingPageInfo: async (reviewerId: number, eventSlug: string) => {
//     const [reviewer] = await db
//       .select({
//         id: reviewers.id,
//         name: reviewers.name,
//         avatarUrl: reviewers.avatarUrl,
//         bio: reviewers.bio,
//       })
//       .from(reviewers)
//       .where(and(eq(reviewers.id, reviewerId), eq(reviewers.isActive, true)))
//       .limit(1);

//     if (!reviewer) {
//       throw new AppError("Reviewer not found", 404);
//     }

//     const [eventType] = await db
//       .select({
//         id: eventTypes.id,
//         name: eventTypes.name,
//         slug: eventTypes.slug,
//         durationMinutes: eventTypes.durationMinutes,
//         description: eventTypes.description,
//       })
//       .from(eventTypes)
//       .where(
//         and(
//           eq(eventTypes.reviewerId, reviewerId),
//           eq(eventTypes.slug, eventSlug),
//           eq(eventTypes.isActive, true)
//         )
//       )
//       .limit(1);

//     if (!eventType) {
//       throw new AppError("Event type not found", 404);
//     }

//     return { reviewer, eventType };
//   },
// };


import { eq, and } from "drizzle-orm";
import { db } from "../../config/db.js";
import { reviewers } from "../../db/schema/reviewers.js";
import { eventTypes } from "../../db/schema/eventTypes.js";
import { availabilityTemplates } from "../../db/schema/availabilityTemplates.js";
import { AppError } from "../../core/errors/AppError.js";

export const eventTypeService = {
  // Public lookup for the booking page — given a reviewerId and an event
  // type slug, returns just the fields safe to show publicly (no email,
  // no internal IDs beyond what's needed to call the slots/booking APIs).
  getBookingPageInfo: async (reviewerId: number, eventSlug: string) => {
    const [reviewer] = await db
      .select({
        id: reviewers.id,
        name: reviewers.name,
        avatarUrl: reviewers.avatarUrl,
        bio: reviewers.bio,
      })
      .from(reviewers)
      .where(and(eq(reviewers.id, reviewerId), eq(reviewers.isActive, true)))
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
      })
      .from(eventTypes)
      .innerJoin(
        availabilityTemplates,
        eq(eventTypes.availabilityTemplateId, availabilityTemplates.id)
      )
      .where(
        and(
          eq(eventTypes.reviewerId, reviewerId),
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
};