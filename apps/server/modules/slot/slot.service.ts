import dayjs from "dayjs";
import { eq, and } from "drizzle-orm";
import { db } from "../../config/db.js";
import { eventTypes } from "../../db/schema/eventTypes.js";
import { templateTimeBlocks } from "../../db/schema/templateTimeBlocks.js";
import { vacationBlocks } from "../../db/schema/vacationBlocks.js";
import { slots } from "../../db/schema/slots.js";
import { AppError } from "../../core/errors/AppError.js";
import type { GenerateSlotsInput } from "./slot.schema.js";

export const slotService = {
  generateSlots: async (data: GenerateSlotsInput) => {
    // 1. Event type fetch pannu (duration + template link kedaikum)
    const [eventType] = await db
      .select()
      .from(eventTypes)
      .where(eq(eventTypes.id, data.eventTypeId))
      .limit(1);

    if (!eventType) {
      throw new AppError("Event type not found", 404);
    }

    // 2. Andha template-oda time blocks fetch pannu (Mon 9-5, Tue 9-5...)
    const timeBlocks = await db
      .select()
      .from(templateTimeBlocks)
      .where(eq(templateTimeBlocks.templateId, eventType.availabilityTemplateId));

    if (timeBlocks.length === 0) {
      throw new AppError("No availability template blocks found", 400);
    }

    // 3. Reviewer-oda vacation blocks fetch pannu (skip pannanda dates)
    const vacations = await db
      .select()
      .from(vacationBlocks)
      .where(
        and(
          eq(vacationBlocks.reviewerId, eventType.reviewerId),
          eq(vacationBlocks.isActive, true)
        )
      );

    // 4. Date range-la loop pannu, ovvoru date ku slots generate pannu
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
            eventType.durationMinutes
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

    // 5. Insert pannu, already existing slots skip pannu (unique constraint handle pannum)
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

  // Public booking page ku — oru date range ku, available slots list pannuthu
  getAvailableSlots: async (eventTypeId: number, dateFrom: string, dateTo: string) => {
    const results = await db
      .select()
      .from(slots)
      .where(
        and(
          eq(slots.eventTypeId, eventTypeId),
          eq(slots.status, "available")
        )
      );

    return results.filter((s) => s.slotDate >= dateFrom && s.slotDate <= dateTo);
  },
};

// Helper — oru time block ah (e.g. 09:00-17:00), duration vechi chinna slots ah split pannuthu
function generateSlotsForBlock(
  date: string,
  blockStart: string,
  blockEnd: string,
  durationMinutes: number
) {
  const result: { start: string; end: string }[] = [];

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
    slotStart = slotEnd;
  }

  return result;
}