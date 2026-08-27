import dayjs from "dayjs";
import { eq, and, ne, inArray, sql } from "drizzle-orm";
import { db } from "../../config/db.js";

import { vacationBlocks } from "./vacation.model.js";
import { bookings } from "../booking/bookings.model.js";

import { AppError } from "../../core/errors/AppError.js";

import type { CreateVacationBlockInput, UpdateVacationBlockInput } from "./vacation.schema.js";

// Extracts the exact transaction type Drizzle passes into db.transaction()'s callback
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Fetches a vacation block only if it belongs to the given reviewer, else throws 404
const getOwnedVacationBlockOrThrow = async (reviewerId: number, blockId: number) => {
  const [block] = await db
    .select()
    .from(vacationBlocks)
    .where(
      and(
        eq(vacationBlocks.id, blockId),
        eq(vacationBlocks.reviewerId, reviewerId)
      )
    )
    .limit(1);

  if (!block) {
    throw new AppError("Vacation block not found", 404);
  }

  return block;
};

// Checks for any active vacation block that overlaps the given date range
const checkOverlappingVacation = async (
  reviewerId: number,
  startDate: string,
  endDate: string,
  excludeBlockId?: number
) => {
  const conditions = [
    eq(vacationBlocks.reviewerId, reviewerId),
    eq(vacationBlocks.isActive, true),
    sql`${vacationBlocks.startDate} <= ${endDate}`,
    sql`${vacationBlocks.endDate} >= ${startDate}`,
  ];

  if (excludeBlockId) {
    conditions.push(ne(vacationBlocks.id, excludeBlockId));
  }

  const [overlapping] = await db
    .select()
    .from(vacationBlocks)
    .where(and(...conditions))
    .limit(1);

  return overlapping;
};

// Finds confirmed bookings for this reviewer that fall inside the given date range
const findAffectedBookings = async (reviewerId: number, startDate: string, endDate: string) => {
  return db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.reviewerId, reviewerId),
        eq(bookings.status, "confirmed"),
        sql`${bookings.startTime}::date >= ${startDate}::date`,
        sql`${bookings.startTime}::date <= ${endDate}::date`
      )
    );
};

// Cancels the given bookings and records the reason (audit trail via cancelledAt/cancelledReason)
const cancelBookings = async (
  tx: Transaction,
  bookingIds: number[],
  reason: string
) => {
  if (bookingIds.length === 0) return;

  await tx
    .update(bookings)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledReason: reason,
    })
    .where(inArray(bookings.id, bookingIds));

  // TODO: replace with the shared email service once built (see team plan)
  // for (const bookingId of bookingIds) {
  //   await sendEmail({ to: <advisorEmail>, type: 'booking_cancelled_vacation', data: {...} });
  // }
};

export const vacationService = {
  // Creates a new vacation block, warning about (or cancelling) affected bookings
  createVacationBlock: async (reviewerId: number, data: CreateVacationBlockInput) => {
    if (data.startDate < dayjs().format("YYYY-MM-DD")) {
      throw new AppError("Vacation block cannot start in the past", 400);
    }

    const overlapping = await checkOverlappingVacation(reviewerId, data.startDate, data.endDate);
    if (overlapping) {
      throw new AppError("This date range overlaps an existing vacation block", 409);
    }

    const affectedBookings = await findAffectedBookings(reviewerId, data.startDate, data.endDate);

    if (affectedBookings.length > 0 && !data.confirmCancellations) {
      throw new AppError(
        `This vacation block will affect ${affectedBookings.length} booking(s)`,
        409,
        { affectedBookings }
      );
    }

    return db.transaction(async (tx) => {
      const [block] = await tx
        .insert(vacationBlocks)
        .values({
          reviewerId,
          startDate: data.startDate,
          endDate: data.endDate,
          reason: data.reason,
        })
        .returning();

      if (!block) {
        throw new AppError("Failed to create vacation block", 500);
      }

      if (affectedBookings.length > 0) {
        await cancelBookings(
          tx,
          affectedBookings.map((b) => b.id),
          data.reason ? `vacation: ${data.reason}` : "vacation"
        );
      }

      return { ...block, cancelledBookingsCount: affectedBookings.length };
    });
  },

  // Lists all vacation blocks for a reviewer
  listVacationBlocks: async (reviewerId: number) => {
    return db
      .select()
      .from(vacationBlocks)
      .where(eq(vacationBlocks.reviewerId, reviewerId))
      .orderBy(vacationBlocks.startDate);
  },

  // Gets a single vacation block owned by the reviewer
  getVacationBlockById: async (reviewerId: number, blockId: number) => {
    return getOwnedVacationBlockOrThrow(reviewerId, blockId);
  },

  // Updates a vacation block's dates/reason, re-running the same overlap + cancellation checks
  updateVacationBlock: async (
    reviewerId: number,
    blockId: number,
    data: UpdateVacationBlockInput
  ) => {
    const existing = await getOwnedVacationBlockOrThrow(reviewerId, blockId);

    const newStartDate = data.startDate ?? existing.startDate;
    const newEndDate = data.endDate ?? existing.endDate;

    if (newStartDate < dayjs().format("YYYY-MM-DD")) {
      throw new AppError("Vacation block cannot start in the past", 400);
    }

    const overlapping = await checkOverlappingVacation(reviewerId, newStartDate, newEndDate, blockId);
    if (overlapping) {
      throw new AppError("This date range overlaps an existing vacation block", 409);
    }

    // Only newly-covered bookings need the warning/cancel flow — bookings
    // already inside the old range were already cancelled when this block
    // was first created.
    const affectedBookings = await findAffectedBookings(reviewerId, newStartDate, newEndDate);
    const newlyAffected = affectedBookings.filter((b) => {
      const bookingDate = dayjs(b.startTime).format("YYYY-MM-DD");
      return bookingDate < existing.startDate || bookingDate > existing.endDate;
    });

    if (newlyAffected.length > 0 && !data.confirmCancellations) {
      throw new AppError(
        `This change will affect ${newlyAffected.length} additional booking(s)`,
        409,
        { affectedBookings: newlyAffected }
      );
    }

    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(vacationBlocks)
        .set({
          startDate: newStartDate,
          endDate: newEndDate,
          reason: data.reason ?? existing.reason,
          updatedAt: new Date(),
        })
        .where(eq(vacationBlocks.id, blockId))
        .returning();

      const effectiveReason = data.reason ?? existing.reason;

      if (newlyAffected.length > 0) {
        await cancelBookings(
          tx,
          newlyAffected.map((b) => b.id),
          effectiveReason ? `vacation: ${effectiveReason}` : "vacation"
        );
      }

      return { ...updated, cancelledBookingsCount: newlyAffected.length };
    });
  },

  // Deletes a vacation block (does not un-cancel any bookings already cancelled by it)
  deleteVacationBlock: async (reviewerId: number, blockId: number) => {
    await getOwnedVacationBlockOrThrow(reviewerId, blockId);

    await db
      .delete(vacationBlocks)
      .where(eq(vacationBlocks.id, blockId));

    return { id: blockId };
  },
};