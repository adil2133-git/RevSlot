import bcrypt from "bcryptjs";
import { db } from "../config/db.js";
import { admins } from "../db/schema/admins.js";
import { reviewers } from "../db/schema/reviewers.js";
import { availabilityTemplates } from "../db/schema/availabilityTemplates.js";
import { templateTimeBlocks } from "../db/schema/templateTimeBlocks.js";
import { eventTypes } from "../db/schema/eventTypes.js";
import { eq } from "drizzle-orm";

const seed = async () => {
    const passwordHash = await bcrypt.hash("admin@123", 10);

    await db.insert(admins).values({
        name: "Test Admin",
        email: "admin@test.com",
        passwordHash
    }).onConflictDoNothing({
        target: admins.email
    });

    console.log("seed successfully created admins data");

    // --- Test Reviewer ---
    const reviewerPasswordHash = await bcrypt.hash("reviewer@123", 10);

    await db.insert(reviewers).values({
        name: "Test Reviewer",
        email: "reviewer@test.com",
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
    for (const day of [1, 2, 3, 4, 5]) {
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
};

seed().catch((error) => {
    console.log("seed failed", error);
    process.exit(1);
});