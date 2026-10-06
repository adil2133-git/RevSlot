import dayjs from "dayjs";
import { db } from "../../config/db.js";
import { AppError } from "../../core/errors/AppError.js";
import type {
  CreateTemplateInput,
  UpdateTemplateInput,
  ReplaceTimeBlocksInput,
  CreateDateOverrideInput,
} from "./availability.validation.js";
import {
  findOwnedTemplateRepo,
  findEventTypesByTemplateIdRepo,
  findConfirmedBookingsOnDateRepo,
  findReviewerProfileForAvailabilityRepo,
  findTemplateByNameRepo,
  findTemplatesByReviewerRepo,
  clearDefaultTemplateForReviewerRepo,
  insertTemplateRepo,
  findTemplateTimeBlocksByTemplateIdsRepo,
  findTemplateTimeBlocksByTemplateIdRepo,
  updateTemplateRepo,
  setDefaultTemplateRepo,
  reassignEventTypesToFallbackTemplateRepo,
  deleteTemplateRepo,
  deleteTemplateTimeBlocksRepo,
  insertTemplateTimeBlocksRepo,
  findDateOverrideByTemplateAndDateRepo,
  insertDateOverrideRepo,
  insertDateOverrideBlocksRepo,
  findDateOverridesByTemplateIdRepo,
  findDateOverrideBlocksByOverrideIdsRepo,
  findDateOverrideByIdAndTemplateIdRepo,
  deleteDateOverrideRepo,
} from "./availability.repository.js";

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
  const template = await findOwnedTemplateRepo(reviewerId, templateId);

  if (!template) {
    throw new AppError("Availability template not found", 404);
  }

  return template;
};

// Checks whether an existing booking's time still fits inside the given
// time blocks. If blocks is empty (fully unavailable), nothing fits.
const bookingFitsInBlocks = (
  bookingStart: Date,
  bookingEnd: Date,
  blocks: { startTime: string; endTime: string }[],
  _overrideDate: string
) => {
  if (blocks.length === 0) return false;

  const bookingStartTime = dayjs(bookingStart).format("HH:mm:ss");
  const bookingEndTime = dayjs(bookingEnd).format("HH:mm:ss");

  return blocks.some(
    (block) => bookingStartTime >= block.startTime && bookingEndTime <= block.endTime
  );
};

// Finds bookings on the override's date (under event types using this
// template) whose time no longer fits the new/absent availability.
const findConflictingBookings = async (
  templateId: number,
  date: string,
  isUnavailable: boolean,
  newBlocks: { startTime: string; endTime: string }[]
) => {
  // 1. Find all event types using this template
  const relatedEventTypes = await findEventTypesByTemplateIdRepo(templateId);

  if (relatedEventTypes.length === 0) return [];

  const eventTypeIds = relatedEventTypes.map((e) => e.id);

  // 2. Find confirmed bookings on this date, under those event types
  const candidateBookings = await findConfirmedBookingsOnDateRepo(eventTypeIds, date);

  if (candidateBookings.length === 0) return [];

  // 3. Filter to only those whose time no longer fits
  if (isUnavailable) {
    // Fully unavailable — every booking on this date is a conflict
    return candidateBookings;
  }

  return candidateBookings.filter(
    (b) => !bookingFitsInBlocks(b.startTime, b.endTime, newBlocks, date)
  );
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
    // Check if reviewer has a username and whatsappNumber set before allowing availability creation
    const reviewer = await findReviewerProfileForAvailabilityRepo(reviewerId);

    if (!reviewer || !reviewer.username || reviewer.username.trim().length === 0) {
      throw new AppError("Username is required before setting availability", 400);
    }

    if (!reviewer.whatsappNumber || reviewer.whatsappNumber.trim().length === 0) {
      throw new AppError("WhatsApp number is required before setting availability. Please add your WhatsApp number in your profile.", 400);
    }

    const existing = await findTemplateByNameRepo(reviewerId, data.name);
    if (existing) {
      throw new AppError("A template with this name already exists", 409);
    }

    const userTemplates = await findTemplatesByReviewerRepo(reviewerId);

    const isFirst = userTemplates.length === 0;
    const shouldBeDefault = Boolean(data.isDefault || isFirst);

    if (shouldBeDefault) {
      await clearDefaultTemplateForReviewerRepo(reviewerId);
    }

    const template = await insertTemplateRepo({
      reviewerId,
      name: data.name,
      description: data.description,
      timezone: data.timezone,
      isDefault: shouldBeDefault,
    });

    if (!template) {
      throw new AppError("Failed to create availability template", 500);
    }

    return { ...template, timeBlocks: [] };
  },

  // Lists all templates for a reviewer, each with its attached time blocks
  listTemplates: async (reviewerId: number) => {
    const templates = await findTemplatesByReviewerRepo(reviewerId);

    if (templates.length === 0) return [];

    const templateIds = templates.map((t) => t.id);
    const blocks = await findTemplateTimeBlocksByTemplateIdsRepo(templateIds);

    return templates.map((template) => ({
      ...template,
      timeBlocks: blocks.filter((b) => b.templateId === template.id),
    }));
  },

  // Fetches a single template (owned by the reviewer) with its time blocks
  getTemplateById: async (reviewerId: number, templateId: number) => {
    const template = await getOwnedTemplateOrThrow(reviewerId, templateId);

    const blocks = await findTemplateTimeBlocksByTemplateIdRepo(template.id);
    const overrides = await availabilityService.listDateOverrides(reviewerId, templateId);

    return { ...template, timeBlocks: blocks, dateOverrides: overrides };
  },

  // Updates template metadata (name, description, timezone, isDefault), rejecting duplicate names
  updateTemplate: async (reviewerId: number, templateId: number, data: UpdateTemplateInput) => {
    await getOwnedTemplateOrThrow(reviewerId, templateId);

    if (data.name) {
      const existing = await findTemplateByNameRepo(reviewerId, data.name);
      if (existing && existing.id !== templateId) {
        throw new AppError("A template with this name already exists", 409);
      }
    }

    const userTemplates = await findTemplatesByReviewerRepo(reviewerId);

    const isOnlyTemplate = userTemplates.length === 1;
    const finalIsDefault = isOnlyTemplate ? true : data.isDefault;

    if (finalIsDefault) {
      await clearDefaultTemplateForReviewerRepo(reviewerId, templateId);
    }

    const updateData = { ...data };
    if (finalIsDefault !== undefined) {
      updateData.isDefault = finalIsDefault;
    }

    const updated = await updateTemplateRepo(templateId, updateData);
    return updated;
  },

  // Deletes a template owned by the reviewer (time blocks cascade-delete via FK)
  deleteTemplate: async (reviewerId: number, templateId: number) => {
    const templateToDelete = await getOwnedTemplateOrThrow(reviewerId, templateId);

    const allTemplates = await findTemplatesByReviewerRepo(reviewerId);

    if (allTemplates.length <= 1) {
      throw new AppError(
        "You cannot delete your only availability schedule. Create another schedule before deleting this one.",
        400
      );
    }

    const otherTemplates = allTemplates.filter((t) => t.id !== templateId);
    const fallbackTemplate = otherTemplates.find((t) => t.isDefault) || otherTemplates[0];
    if (!fallbackTemplate) {
      throw new AppError("No fallback availability schedule found", 400);
    }

    const targetFallback = fallbackTemplate;

    const result = await db.transaction(async (tx) => {
      if (templateToDelete.isDefault) {
        await setDefaultTemplateRepo(targetFallback.id, tx);
      }

      // Reassign all event types attached to this template to the fallback template
      const remappedEvents = await reassignEventTypesToFallbackTemplateRepo(
        reviewerId,
        templateId,
        targetFallback.id,
        tx
      );

      // Delete the template (safe now since no event types reference it)
      await deleteTemplateRepo(templateId, tx);

      return {
        id: templateId,
        remappedCount: remappedEvents.length,
        remappedEventNames: remappedEvents.map((e) => e.name),
        fallbackTemplateName: targetFallback.name,
      };
    });

    return result;
  },

  // Atomically replaces all time blocks for a template with the given list
  replaceTimeBlocks: async (
    reviewerId: number,
    templateId: number,
    data: ReplaceTimeBlocksInput
  ) => {
    await getOwnedTemplateOrThrow(reviewerId, templateId);

    const result = await db.transaction(async (tx) => {
      await deleteTemplateTimeBlocksRepo(templateId, tx);

      if (data.blocks.length === 0) {
        return [];
      }

      return await insertTemplateTimeBlocksRepo(
        data.blocks.map((block) => ({
          templateId,
          dayOfWeek: block.dayOfWeek,
          startTime: block.startTime,
          endTime: block.endTime,
          displayOrder: block.displayOrder,
        })),
        tx
      );
    });

    return result;
  },

  createDateOverride: async (reviewerId: number, templateId: number, data: CreateDateOverrideInput) => {
    await getOwnedTemplateOrThrow(reviewerId, templateId);

    const today = new Date().toISOString().slice(0, 10);
    if (data.date < today) {
      throw new AppError("Cannot add an override for a past date", 400);
    }

    const existing = await findDateOverrideByTemplateAndDateRepo(templateId, data.date);
    if (existing) {
      throw new AppError("An override for this date already exists", 409);
    }

    // Check for conflicting bookings BEFORE creating, so we can include the
    // warning in the same response without a second round-trip.
    const conflictingBookings = await findConflictingBookings(
      templateId,
      data.date,
      data.isUnavailable,
      data.isUnavailable ? [] : data.blocks
    );

    const result = await db.transaction(async (tx) => {
      const override = await insertDateOverrideRepo(
        { templateId, date: data.date, isUnavailable: data.isUnavailable },
        tx
      );

      if (!override) {
        throw new AppError("Failed to create date override", 500);
      }

      let blocks: Awaited<ReturnType<typeof insertDateOverrideBlocksRepo>> = [];
      if (!data.isUnavailable && data.blocks.length > 0) {
        blocks = await insertDateOverrideBlocksRepo(
          data.blocks.map((block, idx) => ({
            overrideId: override.id,
            startTime: block.startTime,
            endTime: block.endTime,
            displayOrder: block.displayOrder ?? idx,
          })),
          tx
        );
      }

      return { ...override, blocks };
    });

    // Not blocking, just informational — override is created either way.
    return {
      ...result,
      warning:
        conflictingBookings.length > 0
          ? {
              message: `${conflictingBookings.length} existing booking(s) on this date may no longer fit your updated availability`,
              affectedBookings: conflictingBookings,
            }
          : null,
    };
  },

  // Lists all date overrides (with their blocks) for a template
  listDateOverrides: async (reviewerId: number, templateId: number) => {
    await getOwnedTemplateOrThrow(reviewerId, templateId);

    const overrides = await findDateOverridesByTemplateIdRepo(templateId);

    if (overrides.length === 0) return [];

    const overrideIds = overrides.map((o) => o.id);
    const blocks = await findDateOverrideBlocksByOverrideIdsRepo(overrideIds);

    return overrides.map((override) => ({
      ...override,
      blocks: blocks.filter((b) => b.overrideId === override.id),
    }));
  },

  // Deletes one date override (its blocks cascade-delete via FK)
  deleteDateOverride: async (reviewerId: number, templateId: number, overrideId: number) => {
    await getOwnedTemplateOrThrow(reviewerId, templateId);

    const existing = await findDateOverrideByIdAndTemplateIdRepo(overrideId, templateId);
    if (!existing) {
      throw new AppError("Date override not found", 404);
    }

    await deleteDateOverrideRepo(overrideId);
    return { id: overrideId };
  },
};