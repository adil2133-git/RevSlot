import { eq } from "drizzle-orm";
import { db } from "../../config/db.js";
import { reviewers } from "../auth/reviewers.schema.js";
import { AppError } from "../../core/errors/AppError.js";
import { BOOKING_FIELD_DEFINITIONS, type BookingFieldKey } from "./bookingFields.js";
import type { ReplaceBookingFieldsInput } from "./bookingFields.validation.js";

// Reviewer-wide, not per-event-type: one selection applies to every
// event type this reviewer offers. Only fieldKey + displayOrder are
// persisted — label/type/category always come from BOOKING_FIELD_DEFINITIONS.
export const bookingFieldsService = {
  getBookingFields: async (reviewerId: number) => {
    const [reviewer] = await db
      .select({ bookingFormFields: reviewers.bookingFormFields })
      .from(reviewers)
      .where(eq(reviewers.id, reviewerId))
      .limit(1);

    if (!reviewer) {
      throw new AppError("Reviewer not found", 404);
    }

    const fields = [...reviewer.bookingFormFields].sort((a, b) => a.displayOrder - b.displayOrder);

    return {
      fields: fields.map(({ fieldKey, displayOrder }) => {
        const definition = BOOKING_FIELD_DEFINITIONS[fieldKey as BookingFieldKey];
        return {
          fieldKey,
          displayOrder,
          label: definition?.label ?? fieldKey,
          type: definition?.type ?? "text",
          category: definition?.category ?? "Additional",
        };
      }),
    };
  },

  replaceBookingFields: async (reviewerId: number, data: ReplaceBookingFieldsInput) => {
    const [updated] = await db
      .update(reviewers)
      .set({ bookingFormFields: data.fields, updatedAt: new Date() })
      .where(eq(reviewers.id, reviewerId))
      .returning({ bookingFormFields: reviewers.bookingFormFields });

    if (!updated) {
      throw new AppError("Reviewer not found", 404);
    }

    return { fields: updated.bookingFormFields };
  },
};