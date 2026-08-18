import { eq, and, asc, inArray, ne } from "drizzle-orm";
import { db } from "../../config/db.js";

import { availabilityTemplates } from "../../db/schema/availabilityTemplates.js";
import { templateTimeBlocks } from "../../db/schema/templateTimeBlocks.js";

import { templateDateOverrides } from "../../db/schema/templateDateOverrides.js";
import { templateOverrideBlocks } from "../../db/schema/templateDateOverrideBlocks.js";
import type { CreateDateOverrideInput } from "./availability.schema.js";

import { AppError } from "../../core/errors/AppError.js";

import type {
  CreateTemplateInput,
  UpdateTemplateInput,
  ReplaceTimeBlocksInput,
} from "./availability.schema.js";

let cachedTimezones: { value: string; label: string }[] | null = null;

function buildTimezoneOptions() {
  const zones = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  return zones
    .map((zone) => {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: zone,
        timeZoneName: "longOffset",
      }).formatToParts(new Date());
      const offsetRaw = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+00:00";
      const match = offsetRaw.match(/GMT([+-])(\d{2}):(\d{2})/);
      const offsetMinutes = match
        ? (match[1] === "-" ? -1 : 1) * (parseInt(match[2] ?? "0", 10) * 60 + parseInt(match[3] ?? "0", 10))
        : 0;
      return { value: zone, label: `${zone} (${offsetRaw})`, offsetMinutes };
    })
    .sort((a, b) => a.offsetMinutes - b.offsetMinutes)
    .map(({ value, label }) => ({ value, label }));
}

function buildTimeOptions() {
  const options: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      const period = h >= 12 ? "PM" : "AM";
      const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const label = `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
      options.push({ value, label });
    }
  }
  return options;
}

// Fetches a template only if it belongs to the given reviewer, else throws 404
const getOwnedTemplateOrThrow = async (reviewerId: number, templateId: number) => {
  const [template] = await db
    .select()
    .from(availabilityTemplates)
    .where(
      and(
        eq(availabilityTemplates.id, templateId),
        eq(availabilityTemplates.reviewerId, reviewerId)
      )
    )
    .limit(1);

  if (!template) {
    throw new AppError("Availability template not found", 404);
  }

  return template;
};

export const availabilityService = {
  // Returns the cached list of timezone options with GMT offset labels
  getTimezoneOptions: async () => {
    cachedTimezones ??= buildTimezoneOptions();
    return cachedTimezones;
  },

  // Returns the list of 30-minute time-of-day options for the time picker
  getTimeOptions: async () => {
    return buildTimeOptions();
  },

  // Creates a new availability template for the reviewer, rejecting duplicate names
  createTemplate: async (reviewerId: number, data: CreateTemplateInput) => {
    const [existing] = await db
      .select()
      .from(availabilityTemplates)
      .where(
        and(
          eq(availabilityTemplates.reviewerId, reviewerId),
          eq(availabilityTemplates.name, data.name)
        )
      )
      .limit(1);

    if (existing) {
      throw new AppError("A template with this name already exists", 409);
    }

    if (data.isDefault) {
      await db
        .update(availabilityTemplates)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(availabilityTemplates.reviewerId, reviewerId));
    }

    const [template] = await db
      .insert(availabilityTemplates)
      .values({
        reviewerId,
        name: data.name,
        description: data.description,
        timezone: data.timezone,
        isDefault: data.isDefault,
      })
      .returning();

    if (!template) {
      throw new AppError("Failed to create availability template", 500);
    }

    return { ...template, timeBlocks: [] };
  },

  // Lists all templates for a reviewer, each with its attached time blocks
  listTemplates: async (reviewerId: number) => {
    const templates = await db
      .select()
      .from(availabilityTemplates)
      .where(eq(availabilityTemplates.reviewerId, reviewerId))
      .orderBy(asc(availabilityTemplates.createdAt));

    if (templates.length === 0) return [];

    const templateIds = templates.map((t) => t.id);

    const blocks = await db
      .select()
      .from(templateTimeBlocks)
      .where(inArray(templateTimeBlocks.templateId, templateIds))
      .orderBy(asc(templateTimeBlocks.dayOfWeek), asc(templateTimeBlocks.displayOrder));

    return templates.map((template) => ({
      ...template,
      timeBlocks: blocks.filter((b) => b.templateId === template.id),
    }));
  },

  // Fetches a single template (owned by the reviewer) with its time blocks
  getTemplateById: async (reviewerId: number, templateId: number) => {
    const template = await getOwnedTemplateOrThrow(reviewerId, templateId);

    const blocks = await db
      .select()
      .from(templateTimeBlocks)
      .where(eq(templateTimeBlocks.templateId, template.id))
      .orderBy(asc(templateTimeBlocks.dayOfWeek), asc(templateTimeBlocks.displayOrder));

    const overrides = await availabilityService.listDateOverrides(reviewerId, templateId);

    return { ...template, timeBlocks: blocks, dateOverrides: overrides };
  },

  // Updates template metadata (name, description, timezone, isDefault), rejecting duplicate names
  updateTemplate: async (reviewerId: number, templateId: number, data: UpdateTemplateInput) => {
    await getOwnedTemplateOrThrow(reviewerId, templateId);

    if (data.name) {
      const [existing] = await db
        .select()
        .from(availabilityTemplates)
        .where(
          and(
            eq(availabilityTemplates.reviewerId, reviewerId),
            eq(availabilityTemplates.name, data.name)
          )
        )
        .limit(1);

      if (existing && existing.id !== templateId) {
        throw new AppError("A template with this name already exists", 409);
      }
    }

    if (data.isDefault) {
      await db
        .update(availabilityTemplates)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(
          and(
            eq(availabilityTemplates.reviewerId, reviewerId),
            ne(availabilityTemplates.id, templateId)
          )
        );
    }

    const [updated] = await db
      .update(availabilityTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(availabilityTemplates.id, templateId))
      .returning();

    return updated;
  },

  // Deletes a template owned by the reviewer (time blocks cascade-delete via FK)
  deleteTemplate: async (reviewerId: number, templateId: number) => {
    await getOwnedTemplateOrThrow(reviewerId, templateId);

    await db
      .delete(availabilityTemplates)
      .where(eq(availabilityTemplates.id, templateId));

    return { id: templateId };
  },

  // Atomically replaces all time blocks for a template with the given list
  replaceTimeBlocks: async (
    reviewerId: number,
    templateId: number,
    data: ReplaceTimeBlocksInput
  ) => {
    await getOwnedTemplateOrThrow(reviewerId, templateId);

    const result = await db.transaction(async (tx) => {
      await tx
        .delete(templateTimeBlocks)
        .where(eq(templateTimeBlocks.templateId, templateId));

      if (data.blocks.length === 0) {
        return [];
      }

      return tx
        .insert(templateTimeBlocks)
        .values(
          data.blocks.map((block) => ({
            templateId,
            dayOfWeek: block.dayOfWeek,
            startTime: block.startTime,
            endTime: block.endTime,
            displayOrder: block.displayOrder,
          }))
        )
        .returning();
    });

    return result;
  },

  createDateOverride: async (reviewerId: number, templateId: number, data: CreateDateOverrideInput) => {
    await getOwnedTemplateOrThrow(reviewerId, templateId);

    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD", lexically comparable
    if (data.date < today) {
      throw new AppError("Cannot add an override for a past date", 400);
    }

    const [existing] = await db
      .select()
      .from(templateDateOverrides)
      .where(and(eq(templateDateOverrides.templateId, templateId), eq(templateDateOverrides.date, data.date)))
      .limit(1);

    if (existing) {
      throw new AppError("An override for this date already exists", 409);
    }

    const result = await db.transaction(async (tx) => {
      const [override] = await tx
        .insert(templateDateOverrides)
        .values({ templateId, date: data.date, isUnavailable: data.isUnavailable })
        .returning();

      if (!override) {
        throw new AppError("Failed to create date override", 500);
      }

      let blocks: (typeof templateOverrideBlocks.$inferSelect)[] = [];
      if (!data.isUnavailable && data.blocks.length > 0) {
        blocks = await tx
          .insert(templateOverrideBlocks)
          .values(
            data.blocks.map((block, idx) => ({
              overrideId: override.id,
              startTime: block.startTime,
              endTime: block.endTime,
              displayOrder: block.displayOrder ?? idx,
            }))
          )
          .returning();
      }

      return { ...override, blocks };
    });

    return result;
  },

  // Lists all date overrides (with their blocks) for a template
  listDateOverrides: async (reviewerId: number, templateId: number) => {
    await getOwnedTemplateOrThrow(reviewerId, templateId);

    const overrides = await db
      .select()
      .from(templateDateOverrides)
      .where(eq(templateDateOverrides.templateId, templateId))
      .orderBy(asc(templateDateOverrides.date));

    if (overrides.length === 0) return [];

    const overrideIds = overrides.map((o) => o.id);
    const blocks = await db
      .select()
      .from(templateOverrideBlocks)
      .where(inArray(templateOverrideBlocks.overrideId, overrideIds))
      .orderBy(asc(templateOverrideBlocks.displayOrder));

    return overrides.map((override) => ({
      ...override,
      blocks: blocks.filter((b) => b.overrideId === override.id),
    }));
  },

  // Deletes one date override (its blocks cascade-delete via FK)
  deleteDateOverride: async (reviewerId: number, templateId: number, overrideId: number) => {
    await getOwnedTemplateOrThrow(reviewerId, templateId);

    const [existing] = await db
      .select()
      .from(templateDateOverrides)
      .where(and(eq(templateDateOverrides.id, overrideId), eq(templateDateOverrides.templateId, templateId)))
      .limit(1);

    if (!existing) {
      throw new AppError("Date override not found", 404);
    }

    await db.delete(templateDateOverrides).where(eq(templateDateOverrides.id, overrideId));
    return { id: overrideId };
  },
};