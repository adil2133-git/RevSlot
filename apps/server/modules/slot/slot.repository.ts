import { eq, and, gte, lte, inArray, sql, or, type InferInsertModel } from "drizzle-orm";
import { db } from "../../config/db.js";
import { eventTypes } from "../eventType/eventTypes.schema.js";
import { templateTimeBlocks } from "../availability/schema/templateTimeBlocks.schema.js";
import { vacationBlocks } from "../vacation/vacation.schema.js";
import { slots } from "./slots.schema.js";
import { bookings } from "../booking/bookings.schema.js";
import { templateDateOverrides } from "../availability/schema/templateDateOverrides.schema.js";
import { templateOverrideBlocks } from "../availability/schema/templateDateOverrideBlocks.schema.js";
import { availabilityTemplates } from "../availability/schema/availabilityTemplates.schema.js";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | Transaction;

export type NewSlot = InferInsertModel<typeof slots>;

export const findEventTypeWithTemplateTimezoneRepo = async (
  eventTypeId: number,
  tx: DbOrTx = db
) => {
  const [eventType] = await tx
    .select({
      id: eventTypes.id,
      reviewerId: eventTypes.reviewerId,
      availabilityTemplateId: eventTypes.availabilityTemplateId,
      name: eventTypes.name,
      slug: eventTypes.slug,
      durationMinutes: eventTypes.durationMinutes,
      bufferBeforeMinutes: eventTypes.bufferBeforeMinutes,
      bufferAfterMinutes: eventTypes.bufferAfterMinutes,
      bookingWindowDays: eventTypes.bookingWindowDays,
      isActive: eventTypes.isActive,
      timezone: availabilityTemplates.timezone,
    })
    .from(eventTypes)
    .innerJoin(
      availabilityTemplates,
      eq(eventTypes.availabilityTemplateId, availabilityTemplates.id)
    )
    .where(eq(eventTypes.id, eventTypeId))
    .limit(1);

  return eventType;
};

export const findTemplateTimeBlocksForSlotRepo = async (
  templateId: number,
  tx: DbOrTx = db
) => {
  return await tx
    .select()
    .from(templateTimeBlocks)
    .where(eq(templateTimeBlocks.templateId, templateId));
};

export const findTemplateDateOverridesInRangeRepo = async (
  templateId: number,
  dateFrom: string,
  dateTo: string,
  tx: DbOrTx = db
) => {
  return await tx
    .select()
    .from(templateDateOverrides)
    .where(
      and(
        eq(templateDateOverrides.templateId, templateId),
        gte(templateDateOverrides.date, dateFrom),
        lte(templateDateOverrides.date, dateTo)
      )
    );
};

export const findTemplateOverrideBlocksByOverrideIdsRepo = async (
  overrideIds: number[],
  tx: DbOrTx = db
) => {
  if (overrideIds.length === 0) return [];
  return await tx
    .select()
    .from(templateOverrideBlocks)
    .where(inArray(templateOverrideBlocks.overrideId, overrideIds));
};

export const findActiveVacationBlocksRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  return await tx
    .select()
    .from(vacationBlocks)
    .where(and(eq(vacationBlocks.reviewerId, reviewerId), eq(vacationBlocks.isActive, true)));
};

export const findReservedSlotRangesRepo = async (
  reviewerId: number,
  dateFrom: string,
  dateTo: string,
  tx: DbOrTx = db
) => {
  return await tx
    .select({
      slotDate: slots.slotDate,
      startTime: slots.startTime,
      endTime: slots.endTime,
    })
    .from(slots)
    .where(
      and(
        eq(slots.reviewerId, reviewerId),
        gte(slots.slotDate, dateFrom),
        lte(slots.slotDate, dateTo),
        sql`(
          ${slots.status} = 'booked'
          OR (${slots.status} = 'held' AND ${slots.holdExpiresAt} > now())
        )`
      )
    );
};

export const findReservedBookingRangesRepo = async (
  reviewerId: number,
  rangeStartUtc: Date,
  rangeEndUtc: Date,
  tx: DbOrTx = db
) => {
  return await tx
    .select({
      startTime: bookings.startTime,
      endTime: bookings.endTime,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.reviewerId, reviewerId),
        sql`${bookings.status} IN ('confirmed', 'rescheduled')`,
        sql`(${bookings.startTime} <= ${rangeEndUtc} AND ${bookings.endTime} >= ${rangeStartUtc})`
      )
    );
};

export const reclaimExpiredHoldSlotRepo = async (
  eventTypeId: number,
  slotDate: string,
  startTime: string,
  holdToken: string,
  holdExpiresAt: Date,
  tx: DbOrTx = db
) => {
  const [reclaimed] = await tx
    .update(slots)
    .set({ status: "held", holdToken, holdExpiresAt, updatedAt: new Date() })
    .where(
      and(
        eq(slots.eventTypeId, eventTypeId),
        eq(slots.slotDate, slotDate),
        eq(slots.startTime, startTime),
        or(
          eq(slots.status, "available"),
          and(
            eq(slots.status, "held"),
            sql`${slots.holdExpiresAt} < now()`
          )
        )
      )
    )
    .returning();

  return reclaimed;
};

export const insertHeldSlotRepo = async (
  values: {
    eventTypeId: number;
    reviewerId: number;
    slotDate: string;
    startTime: string;
    endTime: string;
    status: "held";
    holdToken: string;
    holdExpiresAt: Date;
  },
  tx: DbOrTx = db
) => {
  const [inserted] = await tx
    .insert(slots)
    .values(values)
    .onConflictDoNothing()
    .returning();

  return inserted;
};

export const releaseHeldSlotByTokenRepo = async (
  holdToken: string,
  tx: DbOrTx = db
) => {
  const [released] = await tx
    .delete(slots)
    .where(
      and(
        eq(slots.holdToken, holdToken),
        eq(slots.status, "held")
      )
    )
    .returning({ id: slots.id });

  return released;
};

export const slotRepository = {
  findEventTypeWithTemplateTimezone: findEventTypeWithTemplateTimezoneRepo,
  findTemplateTimeBlocksForSlot: findTemplateTimeBlocksForSlotRepo,
  findTemplateDateOverridesInRange: findTemplateDateOverridesInRangeRepo,
  findTemplateOverrideBlocksByOverrideIds: findTemplateOverrideBlocksByOverrideIdsRepo,
  findActiveVacationBlocks: findActiveVacationBlocksRepo,
  findReservedSlotRanges: findReservedSlotRangesRepo,
  findReservedBookingRanges: findReservedBookingRangesRepo,
  reclaimExpiredHoldSlot: reclaimExpiredHoldSlotRepo,
  insertHeldSlot: insertHeldSlotRepo,
  releaseHeldSlotByToken: releaseHeldSlotByTokenRepo,
};
