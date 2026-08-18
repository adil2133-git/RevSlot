import { z } from "zod";

const VALID_TIMEZONES = new Set(
  typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : []
);

const timezoneField = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .refine((tz) => VALID_TIMEZONES.size === 0 || VALID_TIMEZONES.has(tz), {
    message: "Invalid timezone",
  });

// Validates a single time block (day, start/end time, optional order)
const TimeBlockSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, "Invalid time format (HH:MM)"),
  displayOrder: z.number().int().min(0).optional(),
}).refine((block) => block.endTime > block.startTime, {
  message: "endTime must be after startTime",
  path: ["endTime"],
});

// Validates input for creating a new template
export const CreateTemplateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
  timezone: timezoneField.default("UTC"),
  isDefault: z.boolean().optional().default(false),
});

// Validates input for updating template metadata (all fields optional)
export const UpdateTemplateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  timezone: timezoneField.optional(),
  isDefault: z.boolean().optional(),
});

// Validates the full replacement list of time blocks for a template
export const ReplaceTimeBlocksSchema = z.object({
  blocks: z.array(TimeBlockSchema).max(50),
});

const OverrideBlockSchema = z.object({
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, "Invalid time format (HH:MM)"),
  displayOrder: z.number().int().min(0).optional(),
}).refine((block) => block.endTime > block.startTime, {
  message: "endTime must be after startTime",
  path: ["endTime"],
});

export const CreateDateOverrideSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    isUnavailable: z.boolean().optional().default(false),
    blocks: z.array(OverrideBlockSchema).max(20).optional().default([]),
  })
  .refine((data) => data.isUnavailable || data.blocks.length > 0, {
    message: "At least one time block is required when the date is available",
    path: ["blocks"],
  });

export type CreateDateOverrideInput = z.infer<typeof CreateDateOverrideSchema>;
export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>;
export type ReplaceTimeBlocksInput = z.infer<typeof ReplaceTimeBlocksSchema>;