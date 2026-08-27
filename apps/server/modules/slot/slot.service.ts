import dayjs from "dayjs";
import { randomUUID } from "crypto";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db } from "../../config/db.js";
import { eventTypes } from "../eventType/eventTypes.model.js";
import { templateTimeBlocks } from "../availability/templateTimeBlocks.model.js";
import { vacationBlocks } from "../vacation/vacation.model.js";
import { slots } from "./slots.model.js";
import { AppError } from "../../core/errors/AppError.js";
import type { GenerateSlotsInput } from "./slot.schema.js";

export const slotService = {
  // reviewerId = logged-in user (from req.user), used to verify ownership
  generateSlots: async (data: GenerateSlotsInput, reviewerId: number) => {
    // 1. Fetch the event type (gives us duration + template link)
    const [eventType] = await db
      .select()
      .from(eventTypes)
      .where(eq(eventTypes.id, data.eventTypeId))
      .limit(1);

    if (!eventType) {
      throw new AppError("Event type not found", 404);
    }

    // IDOR check — the event type must belong to this reviewer. Without
    // this, any logged-in reviewer could pass another reviewer's
    // eventTypeId and generate slots on their calendar.
    if (eventType.reviewerId !== reviewerId) {
      throw new AppError("You do not have permission to modify this event type", 403);
    }

    // 2. Fetch the template's time blocks (Mon 9-5, Tue 9-5...)
    const timeBlocks = await db
      .select()
      .from(templateTimeBlocks)
      .where(eq(templateTimeBlocks.templateId, eventType.availabilityTemplateId));

    if (timeBlocks.length === 0) {
      throw new AppError("No availability template blocks found", 400);
    }

    // 3. Fetch the reviewer's vacation blocks (dates to skip)
    const vacations = await db
      .select()
      .from(vacationBlocks)
      .where(
        and(
          eq(vacationBlocks.reviewerId, eventType.reviewerId),
          eq(vacationBlocks.isActive, true)
        )
      );

    // 4. Loop over the date range, generating slots for each date
    const slotsToInsert: (typeof slots.$inferInsert)[] = [];
    let current = dayjs(data.dateFrom);
    const end = dayjs(data.dateTo);

    while (current.isSame(end) || current.isBefore(end)) {
      const dayOfWeek = current.day(); // 0=Sunday ... 6=Saturday
      const dateStr = current.format("YYYY-MM-DD");

      const isOnVacation = vacations.some(
        (v) => dateStr >= v.startDate && dateStr <= v.endDate
      );

      if (!isOnVacation) {
        const blocksForDay = timeBlocks.filter((b) => b.dayOfWeek === dayOfWeek);

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
            slotsToInsert.push({
              eventTypeId: eventType.id,
              reviewerId: eventType.reviewerId,
              slotDate: dateStr,
              startTime: slot.start,
              endTime: slot.end,
              status: "available",
            });
          }
        }
      }

      current = current.add(1, "day");
    }

    if (slotsToInsert.length === 0) {
      return { created: 0, skipped: 0 };
    }

    // 5. Insert — existing slots are skipped automatically via the unique constraint
    const inserted = await db
      .insert(slots)
      .values(slotsToInsert)
      .onConflictDoNothing()
      .returning();

    return {
      created: inserted.length,
      skipped: slotsToInsert.length - inserted.length,
    };
  },

  // For the public booking page — lists available slots in a date range.
  // A slot counts as "available" if status = available, OR status = held
  // but the hold has expired (advisor abandoned the form). No cron job
  // needed — expired holds are simply treated as available on read.
  getAvailableSlots: async (eventTypeId: number, dateFrom: string, dateTo: string) => {
    const results = await db
      .select()
      .from(slots)
      .where( 
        and(
          eq(slots.eventTypeId, eventTypeId),
          gte(slots.slotDate, dateFrom),
          lte(slots.slotDate, dateTo),
          sql`(
            ${slots.status} = 'available'
            OR (${slots.status} = 'held' AND ${slots.holdExpiresAt} < now())
          )`
        )
      );

    return results;
  },

  // Called when an advisor selects a slot — locks it briefly (5 mins) so
  // no one else can book it while the form is being filled out.
  // Atomic conditional UPDATE — the "already held by someone else" check
  // happens inside the WHERE clause itself, so if two advisors try to hold
  // the same slot at the same time, only one wins (row-level lock, race-safe).
  holdSlot: async (slotId: number) => {
    const holdToken = randomUUID();
    const holdExpiresAt = dayjs().add(5, "minute").toDate();

    const updated = await db
      .update(slots)
      .set({
        status: "held",
        holdToken,
        holdExpiresAt,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(slots.id, slotId),
          sql`(
            ${slots.status} = 'available'
            OR (${slots.status} = 'held' AND ${slots.holdExpiresAt} < now())
          )`
        )
      )
      .returning();

    const [updatedSlot] = updated;

    if (!updatedSlot) {
      // Either the slot ID is wrong, or it's already held/booked by someone else
      const [existing] = await db.select().from(slots).where(eq(slots.id, slotId)).limit(1);

      if (!existing) {
        throw new AppError("Slot not found", 404);
      }
      throw new AppError("Slot is no longer available", 409);
    }

    return {
      slotId: updatedSlot.id,
      holdToken: updatedSlot.holdToken,
      holdExpiresAt: updatedSlot.holdExpiresAt,
    };
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