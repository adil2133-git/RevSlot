import dayjs from "dayjs";
import { randomUUID } from "crypto";
import { eq, and, gte, lte, inArray, sql } from "drizzle-orm";
import { db } from "../../config/db.js";
import { eventTypes } from "../eventType/eventTypes.model.js";
import { templateTimeBlocks } from "../availability/templateTimeBlocks.model.js";
import { vacationBlocks } from "../vacation/vacation.model.js";
import { slots } from "./slots.model.js";
import { AppError } from "../../core/errors/AppError.js";
import type { HoldSlotInput, ReleaseSlotInput } from "./slot.schema.js";

type TimeBlockLike = { startTime: string, endTime: string };
type Candidate = { slotDate: string; startTime: string; endTime: string};

  
// Fetches everything needed to compute availability for one event type
// over a date range: the event type itself, its weekly template blocks,
// any date overrides inside the range, and the reviewer's vacation blocks.
async function loadAvailabilityInputs(eventTypeId: number, dateFrom: string, dateTo: string) {
  const [eventType] = await db
    .select()
    .from(eventTypes)
    .where(eq(eventTypes.id, eventTypeId))
    .limit(1);
 
  if (!eventType) {
    throw new AppError("Event type not found", 404);
  }
 
  if (!eventType.isActive) {
    throw new AppError("This event type is not currently accepting bookings", 400);
  }

  const windowEnd = dayjs().add(eventType.bookingWindowDays, "day").format("YYYY-MM-DD");
  const effectiveDateTo = dateTo < windowEnd ? dateTo : windowEnd;
 
  const timeBlocks = await db
    .select()
    .from(templateTimeBlocks)
    .where(eq(templateTimeBlocks.templateId, eventType.availabilityTemplateId));
 
  const overrides = await db
    .select()
    .from(templateDateOverrides)
    .where(
      and(
        eq(templateDateOverrides.templateId, eventType.availabilityTemplateId),
        gte(templateDateOverrides.date, dateFrom),
        lte(templateDateOverrides.date, dateTo)
      )
    );
 
  const overrideBlocksByOverrideId = new Map<number, TimeBlockLike[]>();
  if (overrides.length > 0) {
    const overrideBlocks = await db
      .select()
      .from(templateOverrideBlocks)
      .where(inArray(templateOverrideBlocks.overrideId, overrides.map((o) => o.id)));
 
    for (const block of overrideBlocks) {
      const list = overrideBlocksByOverrideId.get(block.overrideId) ?? [];
      list.push({ startTime: block.startTime, endTime: block.endTime });
      overrideBlocksByOverrideId.set(block.overrideId, list);
    }
  }
 
  // date -> { isUnavailable, blocks } for O(1) lookup while looping days
  const overridesByDate = new Map<string, { isUnavailable: boolean; blocks: TimeBlockLike[] }>();
  for (const override of overrides) {
    overridesByDate.set(override.date, {
      isUnavailable: override.isUnavailable,
      blocks: overrideBlocksByOverrideId.get(override.id) ?? [],
    });
  }
 
  const vacations = await db
    .select()
    .from(vacationBlocks)
    .where(and(eq(vacationBlocks.reviewerId, eventType.reviewerId), eq(vacationBlocks.isActive, true)));
 
  return { eventType, timeBlocks, overridesByDate, vacations, effectiveDateTo };
};


// Rows that currently occupy real time on the reviewer's calendar — across
// ALL of the reviewer's event types, since "all booking links for a
// reviewer share the same calendar" (booking.service.ts checkCrossEventConflict).
// A `held` row only counts if its hold hasn't expired yet.
async function loadReservedRanges(reviewerId: number, dateFrom: string, dateTo: string) {
    return db
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

function timeRangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
};

// Walks dateFrom..dateTo and, for each day, resolves which time blocks
// apply (override wins over the weekly template; "unavailable" override
// means zero blocks that day), then splits each block into duration+buffer
// sized candidate slots.
function computeCandidates(
  dateFrom: string,
  dateTo: string,
  eventType: { durationMinutes: number; bufferBeforeMinutes: number; bufferAfterMinutes: number },
  timeBlocks: { dayOfWeek: number; startTime: string; endTime: string }[],
  overridesByDate: Map<string, { isUnavailable: boolean; blocks: TimeBlockLike[] }>,
  vacations: { startDate: string; endDate: string }[]
): Candidate[] {
  const candidates: Candidate[] = [];
  let current = dayjs(dateFrom);
  const end = dayjs(dateTo);
  const now = dayjs();
  const todayStr = now.format("YYYY-MM-DD");     

  while (current.isSame(end) || current.isBefore(end)) {
    const dateStr = current.format("YYYY-MM-DD");
    const dayOfWeek = current.day();

    const isOnVacation = vacations.some((v) => dateStr >= v.startDate && dateStr <= v.endDate);

    if (!isOnVacation) {
      const override = overridesByDate.get(dateStr);
      const blocksForDay: TimeBlockLike[] = override
        ? override.isUnavailable
          ? []
          : override.blocks
        : timeBlocks.filter((b) => b.dayOfWeek === dayOfWeek);

      for (const block of blocksForDay) {
        const generated = generateSlotsForBlock(
          dateStr,
          block.startTime,
          block.endTime,
          eventType.durationMinutes,
          eventType.bufferBeforeMinutes,
          eventType.bufferAfterMinutes
        );

        for (const slot of generated) {
            if (dateStr === todayStr) {
            const slotStart = dayjs(`${dateStr}T${slot.start}`);
            if (!slotStart.isAfter(now)) {
              continue;
            }
          }
          candidates.push({ slotDate: dateStr, startTime: slot.start, endTime: slot.end });
        }
      }
    }

    current = current.add(1, "day");
  }

  return candidates;
}

export const slotService = {
  // Public — the booking calendar. Pure read + calculation, no writes.
  getAvailableSlots: async (eventTypeId: number, dateFrom: string, dateTo: string) => {
       const { eventType, timeBlocks, overridesByDate, vacations, effectiveDateTo } = await loadAvailabilityInputs(
      eventTypeId,
      dateFrom,
      dateTo
    );

    if (dateFrom > effectiveDateTo) {
      return [];
    }
 
    const candidates = computeCandidates(dateFrom, effectiveDateTo, eventType, timeBlocks, overridesByDate, vacations);
 
    if (candidates.length === 0) {
      return [];
    }
 
    const reserved = await loadReservedRanges(eventType.reviewerId, dateFrom, effectiveDateTo);
 
    const available = candidates.filter(
      (c) =>
        !reserved.some(
          (r) => r.slotDate === c.slotDate && timeRangesOverlap(c.startTime, c.endTime, r.startTime, r.endTime)
        )
    );
 
    return available.map((c) => ({
      eventTypeId,
      date: c.slotDate,
      startTime: c.startTime,
      endTime: c.endTime,
    }));
  },


    // Called when an advisor picks a slot on the booking page. Nothing is
  // materialized until this call — this is the ONE place a `slots` row
  // gets written for a not-yet-booked time. Two steps:
  //   1. Re-validate the exact slot against the live availability rules
  //      (protects against a stale client cache offering a slot that a
  //      template edit / vacation / override has since removed).
  //   2. Atomically claim the row — reclaim an expired hold if one exists,
  //      otherwise insert fresh; the unique constraint on
  //      (eventTypeId, slotDate, startTime) makes this race-safe.
  holdSlot: async (data: HoldSlotInput) => {
    const { eventType, timeBlocks, overridesByDate, vacations, effectiveDateTo  } = await loadAvailabilityInputs(
      data.eventTypeId,
      data.date,
      data.date
    );

    if (data.date > effectiveDateTo) {
      throw new AppError("This slot is not part of the reviewer's current availability", 400);
    }
 
    const candidates = computeCandidates(data.date, data.date, eventType, timeBlocks, overridesByDate, vacations);
 
    const isValid = candidates.some((c) => c.startTime === data.startTime && c.endTime === data.endTime);
 
    if (!isValid) {
      throw new AppError("This slot is not part of the reviewer's current availability", 400);
    }
 
    const reserved = await loadReservedRanges(eventType.reviewerId, data.date, data.date);
    const alreadyTaken = reserved.some(
      (r) => r.slotDate === data.date && timeRangesOverlap(data.startTime, data.endTime, r.startTime, r.endTime)
    );
 
    if (alreadyTaken) {
      throw new AppError("Slot is no longer available", 409);
    }
 
    const holdToken = randomUUID();
    const holdExpiresAt = dayjs().add(5, "minute").toDate();
 
    return db.transaction(async (tx) => {
      // Reclaim an expired hold row for this exact slot, if one exists.
      const [reclaimed] = await tx
        .update(slots)
        .set({ status: "held", holdToken, holdExpiresAt, updatedAt: new Date() })
        .where(
          and(
            eq(slots.eventTypeId, data.eventTypeId),
            eq(slots.slotDate, data.date),
            eq(slots.startTime, data.startTime),
            sql`${slots.status} = 'held' AND ${slots.holdExpiresAt} < now()`
          )
        )
        .returning();
 
      if (reclaimed) {
        return { slotId: reclaimed.id, holdToken, holdExpiresAt };
      }
 
      // No existing row (the common case) — insert fresh. onConflictDoNothing
      // covers the race where two people hold the same slot at once.
      const [inserted] = await tx
        .insert(slots)
        .values({
          eventTypeId: eventType.id,
          reviewerId: eventType.reviewerId,
          slotDate: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          status: "held",
          holdToken,
          holdExpiresAt,
        })
        .onConflictDoNothing()
        .returning();
 
      if (!inserted) {
        throw new AppError("Slot is no longer available", 409);
      }
 
      return { slotId: inserted.id, holdToken, holdExpiresAt };
    });
  },

   // Called when an advisor backs out of a hold (picks a different slot,
// hits "Change", closes the tab). Deletes the row outright rather than
// just flipping status, so it stops being "permanent" DB clutter and
// frees up the slot for someone else immediately instead of waiting out
// the 5-minute holdExpiresAt. Only ever touches rows that are still
// `held` under this exact token — a `booked` row (or someone else's
// hold) is never affected, so this can't be used to cancel a real
// booking.
releaseSlot: async (data: ReleaseSlotInput) => {
  const [released] = await db
    .delete(slots)
    .where(
      and(
        eq(slots.holdToken, data.holdToken),
        eq(slots.status, "held")
      )
    )
    .returning({ id: slots.id });

  return { released: Boolean(released) };
},
};
 

// Helper — splits a time block (e.g. 09:00-17:00) into smaller slots based on duration
function generateSlotsForBlock(
  date: string,
  blockStart: string,
  blockEnd: string,
  durationMinutes: number,
  bufferBeforeMinutes = 0,
  bufferAfterMinutes = 0
) {
  const result: { start: string; end: string }[] = [];
  const gapBetweenSlots = bufferBeforeMinutes + bufferAfterMinutes;

  let slotStart = dayjs(`${date}T${blockStart}`);
  const blockEndTime = dayjs(`${date}T${blockEnd}`);

  while (
    slotStart.add(durationMinutes, "minute").isSame(blockEndTime) ||
    slotStart.add(durationMinutes, "minute").isBefore(blockEndTime)
  ) {
    const slotEnd = slotStart.add(durationMinutes, "minute");
    result.push({
      start: slotStart.format("HH:mm:ss"),
      end: slotEnd.format("HH:mm:ss"),
    });
    slotStart = slotEnd.add(gapBetweenSlots, "minute");
  }

  return result;
}