import "dotenv/config";
import bcrypt from "bcryptjs";
import { admins } from "../modules/admin/admins.schema.js";
import { reviewers } from "../modules/auth/reviewers.schema.js";
import { availabilityTemplates } from "../modules/availability/schema/availabilityTemplates.schema.js";
import { templateTimeBlocks } from "../modules/availability/schema/templateTimeBlocks.schema.js";
import { eventTypes } from "../modules/eventType/eventTypes.schema.js";
import { db, pool } from "../config/db.js";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Admin";

const TEST_REVIEWER_EMAIL = process.env.TEST_REVIEWER_EMAIL ?? "test.reviewer@revslot.com";
const TEST_REVIEWER_PASSWORD = process.env.TEST_REVIEWER_PASSWORD ?? "RevSlotTest2026!";
const TEST_REVIEWER_NAME = process.env.TEST_REVIEWER_NAME ?? "Google Test Reviewer";
const TEST_REVIEWER_USERNAME = process.env.TEST_REVIEWER_USERNAME ?? "googletest";

const createAdmin = async () => {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log("Skipping admin seed (ADMIN_EMAIL or ADMIN_PASSWORD not set).");
    return;
  }

  const [existing] = await db
    .select()
    .from(admins)
    .where(eq(admins.email, ADMIN_EMAIL));

  if (existing) {
    console.log(
      `Admin already exists for ${ADMIN_EMAIL} (id: ${existing.id}) — nothing to do.`
    );
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const [created] = await db
    .insert(admins)
    .values({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash,
      emailVerified: true,
    })
    .returning();

  console.log(`Admin created successfully: ${created?.email} (id: ${created?.id})`);
};

const createTestReviewer = async () => {
  const [existing] = await db
    .select()
    .from(reviewers)
    .where(eq(reviewers.email, TEST_REVIEWER_EMAIL));

  if (existing) {
    console.log(
      `Test reviewer already exists for ${TEST_REVIEWER_EMAIL} (username: ${existing.username}) — nothing to do.`
    );
    return;
  }

  const passwordHash = await bcrypt.hash(TEST_REVIEWER_PASSWORD, 10);

  // 1. Create Reviewer with emailVerified = true (no OTP required)
  const [reviewer] = await db
    .insert(reviewers)
    .values({
      name: TEST_REVIEWER_NAME,
      username: TEST_REVIEWER_USERNAME,
      email: TEST_REVIEWER_EMAIL,
      passwordHash,
      emailVerified: true,
      isActive: true,
      bio: "Automated test reviewer account for Google verification and integration testing.",
      professionalHeadline: "Senior Technical Reviewer",
    })
    .returning();

  if (!reviewer) {
    throw new Error("Failed to create test reviewer");
  }

  console.log(`Test Reviewer created: ${reviewer.email} (id: ${reviewer.id}, username: ${reviewer.username})`);

  // 2. Create Default Availability Template
  const [template] = await db
    .insert(availabilityTemplates)
    .values({
      reviewerId: reviewer.id,
      name: "Working Hours",
      timezone: "Asia/Kolkata",
      isDefault: true,
    })
    .returning();

  if (!template) {
    throw new Error("Failed to create default availability template");
  }

  // 3. Create Monday-Friday Time Blocks (09:00 - 17:00)
  const blocks = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
    templateId: template.id,
    dayOfWeek,
    startTime: "09:00:00",
    endTime: "17:00:00",
  }));

  await db.insert(templateTimeBlocks).values(blocks);
  console.log("Added standard Mon-Fri availability time blocks (09:00 - 17:00)");

  // 4. Create a Free Test Event Type
  const [eventType] = await db
    .insert(eventTypes)
    .values({
      reviewerId: reviewer.id,
      availabilityTemplateId: template.id,
      name: "Technical Review Session",
      slug: "tech-review",
      durationMinutes: 30,
      description: "Sample review session for evaluation and testing.",
      price: 0,
      isActive: true,
      isPublic: true,
      bookingWindowDays: 14,
    })
    .returning();

  console.log(`Test Event Type created: ${eventType?.name} (/ ${reviewer.username}/${eventType?.slug})`);
  console.log("--------------------------------------------------");
  console.log("Test Reviewer Credentials:");
  console.log(`Email:    ${TEST_REVIEWER_EMAIL}`);
  console.log(`Password: ${TEST_REVIEWER_PASSWORD}`);
  console.log("--------------------------------------------------");
};

const main = async () => {
  await createAdmin();
  await createTestReviewer();
};

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Seeding failed:", error);
    await pool.end();
    process.exit(1);
  });