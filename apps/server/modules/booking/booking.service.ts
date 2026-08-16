import { eq, and, ne, sql } from "drizzle-orm";
import { db } from "../../config/db.js";
import { slots } from "../../db/schema/slots.js";
import { AppError } from "../../core/errors/AppError.js";
import type { CreateBookingInput } from "./booking.schema.js";

// TODO(teammate): `bookings` table ready aana odane idha uncomment pannu
// import { bookings } from "../../db/schema/bookings.js";

export const bookingService = {
  // Same reviewer-oda vera event types la irukra slots-oda overlap check
  // pannuthu — bookings table venaam, slots table mattum use pannuthu
  checkCrossEventConflict: async (
    reviewerId: number,
    slotDate: string,
    startTime: string,
    endTime: string,
    excludeSlotId: number
  ) => {
    const conflicts = await db
      .select()
      .from(slots)
      .where(
        and(
          eq(slots.reviewerId, reviewerId),
          eq(slots.slotDate, slotDate),
          ne(slots.id, excludeSlotId),
          sql`${slots.status} IN ('held', 'booked')`,
          sql`(${slots.startTime}, ${slots.endTime}) OVERLAPS (${startTime}::time, ${endTime}::time)`
        )
      );

    return conflicts.length > 0;
  },

  createBooking: async (data: CreateBookingInput) => {
    return db.transaction(async (tx) => {
      // 1. holdToken vechi slot fetch — held ah irukanum, expire aagama irukanum
      const [slot] = await tx
        .select()
        .from(slots)
        .where(
          and(
            eq(slots.holdToken, data.holdToken),
            eq(slots.status, "held"),
            sql`${slots.holdExpiresAt} > now()`
          )
        )
        .limit(1);

      if (!slot) {
        throw new AppError(
          "Hold expired or invalid — please select the slot again",
          410
        );
      }

      // 2. Cross-event-type conflict double-check (defensive)
      const hasConflict = await bookingService.checkCrossEventConflict(
        slot.reviewerId,
        slot.slotDate,
        slot.startTime,
        slot.endTime,
        slot.id
      );

      if (hasConflict) {
        throw new AppError(
          "This time is no longer available — it overlaps with another booking",
          409
        );
      }

      // 3. TODO(teammate): bookings table ready aana, idha replace pannu:
      //
      // const [booking] = await tx
      //   .insert(bookings)
      //   .values({
      //     slotId: slot.id,
      //     eventTypeId: slot.eventTypeId,
      //     reviewerId: slot.reviewerId,
      //     advisorName: data.advisorName,
      //     advisorEmail: data.advisorEmail,
      //     internName: data.internName,
      //     internBatch: data.internBatch,
      //     internEmails: data.internEmails?.join(","),
      //     weekOrStage: data.weekOrStage,
      //     status: "confirmed",
      //   })
      //   .returning();
      throw new AppError(
        "Booking creation pending — bookings table not yet available",
        501
      );

      // 4. TODO(teammate): booking insert success aana apparam, idha uncomment:
      //
      // await tx
      //   .update(slots)
      //   .set({ status: "booked", updatedAt: new Date() })
      //   .where(eq(slots.id, slot.id));
      //
      // return booking;
    });
  },
};