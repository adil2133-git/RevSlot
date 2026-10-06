import { eq, and, ne, inArray, sql, type InferInsertModel } from "drizzle-orm";
import { db } from "../../config/db.js";
import { vacationBlocks } from "./vacation.schema.js";
import { bookings } from "../booking/bookings.schema.js";
import { eventTypes } from "../eventType/eventTypes.schema.js";
import { reviewers } from "../auth/reviewers.schema.js";
import { availabilityTemplates } from "../availability/schema/availabilityTemplates.schema.js";

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbOrTx = typeof db | Transaction;

export type NewVacationBlock = InferInsertModel<typeof vacationBlocks>;

export const findOwnedVacationBlockRepo = async (
  reviewerId: number,
  blockId: number,
  tx: DbOrTx = db
) => {
  const [block] = await tx
    .select()
    .from(vacationBlocks)
    .where(
      and(
        eq(vacationBlocks.id, blockId),
        eq(vacationBlocks.reviewerId, reviewerId)
      )
    )
    .limit(1);

  return block;
};

export const checkOverlappingVacationRepo = async (
  reviewerId: number,
  startDate: string,
  endDate: string,
  excludeBlockId?: number | undefined,
  tx: DbOrTx = db
) => {
  const conditions = [
    eq(vacationBlocks.reviewerId, reviewerId),
    eq(vacationBlocks.isActive, true),
    sql`${vacationBlocks.startDate} <= ${endDate}`,
    sql`${vacationBlocks.endDate} >= ${startDate}`,
  ];

  if (excludeBlockId !== undefined) {
    conditions.push(ne(vacationBlocks.id, excludeBlockId));
  }

  const [overlapping] = await tx
    .select()
    .from(vacationBlocks)
    .where(and(...conditions))
    .limit(1);

  return overlapping;
};

export const findAffectedBookingsRepo = async (
  reviewerId: number,
  startDate: string,
  endDate: string,
  tx: DbOrTx = db
) => {
  return await tx
    .select({
      id: bookings.id,
      internName: bookings.internName,
      internEmails: bookings.internEmails,
      batch: bookings.batch,
      advisorEmail: bookings.advisorEmail,
      advisorName: bookings.advisorName,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      formData: bookings.formData,
      timezone: availabilityTemplates.timezone,
      eventTypeName: eventTypes.name,
      reviewerName: reviewers.name,
    })
    .from(bookings)
    .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
    .innerJoin(reviewers, eq(bookings.reviewerId, reviewers.id))
    .leftJoin(availabilityTemplates, eq(eventTypes.availabilityTemplateId, availabilityTemplates.id))
    .where(
      and(
        eq(bookings.reviewerId, reviewerId),
        eq(bookings.status, "confirmed"),
        sql`${bookings.startTime}::date >= ${startDate}::date`,
        sql`${bookings.startTime}::date <= ${endDate}::date`
      )
    );
};

export const cancelBookingsRepo = async (
  bookingIds: number[],
  reason: string,
  tx: DbOrTx = db
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
};

export const insertVacationBlockRepo = async (
  data: {
    reviewerId: number;
    startDate: string;
    endDate: string;
    reason?: string | null | undefined;
  },
  tx: DbOrTx = db
) => {
  const [block] = await tx
    .insert(vacationBlocks)
    .values({
      reviewerId: data.reviewerId,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
    })
    .returning();

  return block;
};

export const listVacationBlocksByReviewerRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  return await tx
    .select()
    .from(vacationBlocks)
    .where(eq(vacationBlocks.reviewerId, reviewerId))
    .orderBy(vacationBlocks.startDate);
};

export const updateVacationBlockRepo = async (
  blockId: number,
  data: {
    startDate?: string | undefined;
    endDate?: string | undefined;
    reason?: string | null | undefined;
  },
  tx: DbOrTx = db
) => {
  const [updated] = await tx
    .update(vacationBlocks)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(vacationBlocks.id, blockId))
    .returning();

  return updated;
};

export const deleteVacationBlockRepo = async (
  blockId: number,
  tx: DbOrTx = db
) => {
  return await tx
    .delete(vacationBlocks)
    .where(eq(vacationBlocks.id, blockId));
};

export const vacationRepository = {
  findOwnedVacationBlock: findOwnedVacationBlockRepo,
  checkOverlappingVacation: checkOverlappingVacationRepo,
  findAffectedBookings: findAffectedBookingsRepo,
  cancelBookings: cancelBookingsRepo,
  insertVacationBlock: insertVacationBlockRepo,
  listVacationBlocksByReviewer: listVacationBlocksByReviewerRepo,
  updateVacationBlock: updateVacationBlockRepo,
  deleteVacationBlock: deleteVacationBlockRepo,
};
