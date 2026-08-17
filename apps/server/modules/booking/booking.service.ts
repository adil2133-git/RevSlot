// import { eq, and, ne, sql } from "drizzle-orm";
// import { db } from "../../config/db.js";
// import { slots } from "../../db/schema/slots.js";
// import { AppError } from "../../core/errors/AppError.js";
// import type { CreateBookingInput } from "./booking.schema.js";

// // TODO(teammate): `bookings` table ready aana odane idha uncomment pannu
// // import { bookings } from "../../db/schema/bookings.js";

// export const bookingService = {
//   // Same reviewer-oda vera event types la irukra slots-oda overlap check
//   // pannuthu — bookings table venaam, slots table mattum use pannuthu
//   checkCrossEventConflict: async (
//     reviewerId: number,
//     slotDate: string,
//     startTime: string,
//     endTime: string,
//     excludeSlotId: number
//   ) => {
//     const conflicts = await db
//       .select()
//       .from(slots)
//       .where(
//         and(
//           eq(slots.reviewerId, reviewerId),
//           eq(slots.slotDate, slotDate),
//           ne(slots.id, excludeSlotId),
//           sql`${slots.status} IN ('held', 'booked')`,
//           sql`(${slots.startTime}, ${slots.endTime}) OVERLAPS (${startTime}::time, ${endTime}::time)`
//         )
//       );

//     return conflicts.length > 0;
//   },

//   createBooking: async (data: CreateBookingInput) => {
//     return db.transaction(async (tx) => {
//       // 1. holdToken vechi slot fetch — held ah irukanum, expire aagama irukanum
//       const [slot] = await tx
//         .select()
//         .from(slots)
//         .where(
//           and(
//             eq(slots.holdToken, data.holdToken),
//             eq(slots.status, "held"),
//             sql`${slots.holdExpiresAt} > now()`
//           )
//         )
//         .limit(1);

//       if (!slot) {
//         throw new AppError(
//           "Hold expired or invalid — please select the slot again",
//           410
//         );
//       }

//       // 2. Cross-event-type conflict double-check (defensive)
//       const hasConflict = await bookingService.checkCrossEventConflict(
//         slot.reviewerId,
//         slot.slotDate,
//         slot.startTime,
//         slot.endTime,
//         slot.id
//       );

//       if (hasConflict) {
//         throw new AppError(
//           "This time is no longer available — it overlaps with another booking",
//           409
//         );
//       }

//       // 3. TODO(teammate): bookings table ready aana, idha replace pannu:
//       //
//       // const [booking] = await tx
//       //   .insert(bookings)
//       //   .values({
//       //     slotId: slot.id,
//       //     eventTypeId: slot.eventTypeId,
//       //     reviewerId: slot.reviewerId,
//       //     advisorName: data.advisorName,
//       //     advisorEmail: data.advisorEmail,
//       //     internName: data.internName,
//       //     internBatch: data.internBatch,
//       //     internEmails: data.internEmails?.join(","),
//       //     weekOrStage: data.weekOrStage,
//       //     status: "confirmed",
//       //   })
//       //   .returning();
//       throw new AppError(
//         "Booking creation pending — bookings table not yet available",
//         501
//       );

//       // 4. TODO(teammate): booking insert success aana apparam, idha uncomment:
//       //
//       // await tx
//       //   .update(slots)
//       //   .set({ status: "booked", updatedAt: new Date() })
//       //   .where(eq(slots.id, slot.id));
//       //
//       // return booking;
//     });
//   },
// };





import dayjs from "dayjs";
import { eq, and, ne, sql } from "drizzle-orm";
import { db } from "../../config/db.js";
import { slots } from "../../db/schema/slots.js";
import { bookings } from "../../db/schema/bookings.js";
import { AppError } from "../../core/errors/AppError.js";
import type { CreateBookingInput } from "./booking.schema.js";

export const bookingService = {
  // Doc section 7: "All booking links for a reviewer share the same calendar"
  // — a slot booked under one event type must also block the same
  // reviewer's slots under OTHER event types. No need to touch the
  // `bookings` table for this — we check the `slots` table directly for
  // any overlapping 'held'/'booked' slot on the same reviewer + date,
  // excluding the current slot.
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

  // Called when the advisor submits the booking form — verifies the
  // holdToken and confirms the slot. Must run inside a transaction: slot
  // lookup + cross-conflict check + booking insert + slot status update
  // all need to be atomic, otherwise we risk a partial state (slot marked
  // booked with no matching booking row).
  createBooking: async (data: CreateBookingInput) => {
    return db.transaction(async (tx) => {
      // 1. Look up the slot by holdToken — must still be held and not expired.
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

      // 2. Defensive re-check for cross-event-type conflicts. This was
      //    already checked at hold time, but we check again right before
      //    confirming in case something else got booked in the race window.
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

      // 3. The `bookings` table has no slotId column — combine the slot's
      //    date with its time-only startTime/endTime into a full timestamp
      //    (bookings.startTime/endTime are timestamptz columns).
      const startTimestamp = dayjs(
        `${slot.slotDate}T${slot.startTime}`
      ).toDate();
      const endTimestamp = dayjs(`${slot.slotDate}T${slot.endTime}`).toDate();

      // NOTE: advisorName is not persisted — the `bookings` table has no
      // matching column (flagged with Adil, needs a schema change if this
      // should be stored). We still include it in the returned object below
      // so the confirmation response has it.
      const [booking] = await tx
        .insert(bookings)
        .values({
          eventTypeId: slot.eventTypeId,
          reviewerId: slot.reviewerId,
          internName: data.internName,
          batch: data.batch,
          advisorEmail: data.advisorEmail,
          internEmails: data.internEmails,
          weekStage: data.weekStage,
          startTime: startTimestamp,
          endTime: endTimestamp,
          status: "confirmed",
        })
        .returning();

      // 4. Mark the slot as booked — only after the booking insert
      //    succeeds. Since this is all inside one transaction, if any step
      //    fails, everything rolls back together.
      await tx
        .update(slots)
        .set({ status: "booked", updatedAt: new Date() })
        .where(eq(slots.id, slot.id));

      // Include advisorName in the response even though it's not stored
      // in the DB, so the confirmation page/email can display it.
      return { ...booking, advisorName: data.advisorName };
    });
  },
};

