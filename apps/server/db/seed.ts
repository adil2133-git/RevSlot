import bcrypt from "bcryptjs";
import dayjs from "dayjs";
import { admins } from "../modules/admin/admins.model.js";
import { db, pool } from "../config/db.js";
import { reviewers } from "../modules/auth/reviewers.model.js";
import { availabilityTemplates } from "../modules/availability/availabilityTemplates.model.js";
import { templateTimeBlocks } from "../modules/availability/templateTimeBlocks.model.js";
import { eventTypes } from "../modules/eventType/eventTypes.model.js";
import { slots } from "../modules/slot/slots.model.js";
import { bookings } from "../modules/booking/bookings.model.js";
import { eq, and } from "drizzle-orm";

const seed = async () => {
    const passwordHash = await bcrypt.hash("admin@123", 10);

    await db.insert(admins).values({
        name: "Test Admin",
        email: "admin@test.com",
        passwordHash,
        emailVerified: true
    }).onConflictDoNothing({
        target: admins.email
    });

    console.log("seed successfully created admins data");

    // --- Test Reviewer ---
    const reviewerPasswordHash = await bcrypt.hash("reviewer@123", 10);

    await db.insert(reviewers).values({
        name: "Test Reviewer",
        email: "reviewer@test.com",
        username: "test-reviewer",
        passwordHash: reviewerPasswordHash,
        whatsappNumber: "9999999999"
    }).onConflictDoNothing({
        target: reviewers.email
    });

    const [testReviewer] = await db
        .select()
        .from(reviewers)
        .where(eq(reviewers.email, "reviewer@test.com"));

    if (!testReviewer) {
        throw new Error("Test reviewer not found after insert — seed failed unexpectedly");
    }

    console.log("seed successfully created reviewer data");

    // --- Test Availability Template ---
    await db.insert(availabilityTemplates).values({
        reviewerId: testReviewer.id,
        name: "Default Availability",
        description: "Seeded test availability template",
        timezone: "Asia/Kolkata",
        isDefault: true
    }).onConflictDoNothing({
        target: [availabilityTemplates.reviewerId, availabilityTemplates.name]
    });

    const [testTemplate] = await db
        .select()
        .from(availabilityTemplates)
        .where(eq(availabilityTemplates.reviewerId, testReviewer.id));

    if (!testTemplate) {
        throw new Error("Availability template not found after insert — seed failed unexpectedly");
    }

    console.log("seed successfully created availability template");

    // --- Time blocks for the template (Mon–Fri, 9am–5pm) ---
    // No unique constraint on this table, so onConflictDoNothing isn't an
    // option — check for an existing block on this day before inserting,
    // otherwise re-running the seed duplicates these rows every time.
    const existingBlocks = await db
        .select()
        .from(templateTimeBlocks)
        .where(eq(templateTimeBlocks.templateId, testTemplate.id));

    const existingDays = new Set(existingBlocks.map((b) => b.dayOfWeek));

    for (const day of [1, 2, 3, 4, 5]) {
        if (existingDays.has(day)) continue;

        await db.insert(templateTimeBlocks).values({
            templateId: testTemplate.id,
            dayOfWeek: day,
            startTime: "09:00:00",
            endTime: "17:00:00",
            displayOrder: 1
        });
    }

    console.log("seed successfully created template time blocks");

    // --- Test Event Types ---
    await db.insert(eventTypes).values([
        {
            reviewerId: testReviewer.id,
            availabilityTemplateId: testTemplate.id,
            name: "Individual Review",
            slug: "individual-review",
            durationMinutes: 30,
            description: "Seeded test event type"
        },
        {
            reviewerId: testReviewer.id,
            availabilityTemplateId: testTemplate.id,
            name: "Mock Interview",
            slug: "mock-interview",
            durationMinutes: 45,
            description: "Seeded test event type"
        }
    ]).onConflictDoNothing({
        target: [eventTypes.reviewerId, eventTypes.slug]
    });

    console.log("seed successfully created event types");

    // --- Test Slots (for the "Individual Review" event type) ---
    // NOTE: slots are compute-on-read now (see slotService.getAvailableSlots)
    // — availability comes from the template + overrides + vacation blocks,
    // never from pre-generated rows. So we don't seed "available" rows at
    // all here; a `slots` row only exists once someone actually holds or
    // books a time. We just seed one `held` row and one `booked` row (with
    // its matching booking) so there's an example of each to test against.
    const [individualReview] = await db
        .select()
        .from(eventTypes)
        .where(
            and(
                eq(eventTypes.reviewerId, testReviewer.id),
                eq(eventTypes.slug, "individual-review")
            )
        );

    if (!individualReview) {
        throw new Error("Individual Review event type not found after insert — seed failed unexpectedly");
    }

    // Walk forward from today, collecting the next `count` weekdays (Mon–Fri)
    // so slots always land on days the template actually has time blocks for.
    const nextWeekdays = (count: number): string[] => {
        const dates: string[] = [];
        let cursor = dayjs();
        while (dates.length < count) {
            const dow = cursor.day();
            if (dow >= 1 && dow <= 5) {
                dates.push(cursor.format("YYYY-MM-DD"));
            }
            cursor = cursor.add(1, "day");
        }
        return dates;
    };

    // Splits a 09:00–17:00 block into durationMinutes-sized slots for one date.
    const generateSlotsForDay = (date: string, durationMinutes: number) => {
        const result: { start: string; end: string }[] = [];
        let slotStart = dayjs(`${date}T09:00:00`);
        const blockEnd = dayjs(`${date}T17:00:00`);

        while (slotStart.add(durationMinutes, "minute").isSame(blockEnd) || slotStart.add(durationMinutes, "minute").isBefore(blockEnd)) {
            const slotEnd = slotStart.add(durationMinutes, "minute");
            result.push({ start: slotStart.format("HH:mm:ss"), end: slotEnd.format("HH:mm:ss") });
            slotStart = slotEnd;
        }
        return result;
    };

    const weekdays = nextWeekdays(10);

    // Held slot — fixed holdToken so your teammate can hit POST /bookings
    // directly in Postman without calling the hold endpoint first. This is
    // the ONLY kind of write that ever happens for a not-yet-booked slot —
    // exactly what slotService.holdSlot does at request time.
    const SEED_HOLD_TOKEN = "11111111-1111-1111-1111-111111111111";
    const [heldSlotTime] = generateSlotsForDay(weekdays[1]!, individualReview.durationMinutes);

    if (heldSlotTime) {
        const [heldRow] = await db
            .insert(slots)
            .values({
                eventTypeId: individualReview.id,
                reviewerId: testReviewer.id,
                slotDate: weekdays[1]!,
                startTime: heldSlotTime.start,
                endTime: heldSlotTime.end,
                status: "held",
                holdToken: SEED_HOLD_TOKEN,
                holdExpiresAt: dayjs().add(1, "day").toDate(), // generous expiry so it's usable whenever you test
            })
            .onConflictDoNothing({
                target: [slots.eventTypeId, slots.slotDate, slots.startTime]
            })
            .returning();

        if (heldRow) {
            console.log(`seed successfully created one held slot (holdToken: ${SEED_HOLD_TOKEN})`);
        }
    }

    // Booked slot + matching booking row — for testing "already booked" /
    // read-only booking views without having to create one manually.
    const [bookedSlotTime] = generateSlotsForDay(weekdays[2]!, individualReview.durationMinutes);

    if (bookedSlotTime) {
        const bookingStart = dayjs(`${weekdays[2]}T${bookedSlotTime.start}`).toDate();
        const bookingEnd = dayjs(`${weekdays[2]}T${bookedSlotTime.end}`).toDate();

        const existingBooking = await db
            .select()
            .from(bookings)
            .where(
                and(
                    eq(bookings.eventTypeId, individualReview.id),
                    eq(bookings.startTime, bookingStart)
                )
            );

        if (existingBooking.length === 0) {
            const [bookedRow] = await db
                .insert(slots)
                .values({
                    eventTypeId: individualReview.id,
                    reviewerId: testReviewer.id,
                    slotDate: weekdays[2]!,
                    startTime: bookedSlotTime.start,
                    endTime: bookedSlotTime.end,
                    status: "booked",
                })
                .onConflictDoNothing({
                    target: [slots.eventTypeId, slots.slotDate, slots.startTime]
                })
                .returning();

            if (bookedRow) {
                await db.insert(bookings).values({
                    eventTypeId: individualReview.id,
                    reviewerId: testReviewer.id,
                    internName: "Seed Intern",
                    batch: "2026-Batch-A",
                    advisorEmail: "advisor@test.com",
                    internEmails: ["intern@test.com"],
                    weekStage: "Week 4",
                    startTime: bookingStart,
                    endTime: bookingEnd,
                    status: "confirmed",
                });

                console.log("seed successfully created one booked slot + matching booking");
            }
        }
    }

    console.log("\n--- Seeded test data summary ---");
    console.log("Reviewer login: reviewer@test.com / reviewer@123");
    console.log("Admin login:    admin@test.com / admin@123");
    console.log(`Event type id:  ${individualReview.id} (slug: individual-review)`);
    console.log(`Reviewer id:    ${testReviewer.id}`);
    console.log(`Booking page:   /${testReviewer.id}/individual-review`);
    console.log(`Availability computed live (template + overrides + vacation blocks) — no pre-generated rows.`);
    if (heldSlotTime) {
        console.log(`Held slot on ${weekdays[1]} ${heldSlotTime.start} — holdToken: ${SEED_HOLD_TOKEN} (use for POST /bookings)`);
    }
    if (bookedSlotTime) {
        console.log(`Booked slot on ${weekdays[2]} ${bookedSlotTime.start} (already has a matching booking row)`);
    }
    console.log("---------------------------------\n");
};

seed().then(async () => {
    await pool.end();
    process.exit(0);
}).catch(async (error) => {
    console.log("seed failed", error);
    await pool.end();
    process.exit(1);
});