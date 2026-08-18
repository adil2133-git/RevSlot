import type { Request, Response } from "express";
import { availabilityService } from "./availability.service.js";
import { AppError } from "../../core/errors/AppError.js";

// Converts and validates the :id route param into a positive integer
const parseTemplateId = (raw: string | string[] | undefined): number => {
  if (Array.isArray(raw)) {
    throw new AppError("Invalid template id", 400);
  }

  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid template id", 400);
  }
  return id;
};

const parseOverrideId = (raw: string | string[] | undefined): number => {
  if (Array.isArray(raw)) throw new AppError("Invalid override id", 400);
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new AppError("Invalid override id", 400);
  return id;
};

export const availabilityController = {
  // Handles POST / — creates a new availability template
  createTemplate: async (req: Request, res: Response) => {
    const template = await availabilityService.createTemplate(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: { template } });
  },

  // Handles GET / — lists all templates for the logged-in reviewer
  listTemplates: async (req: Request, res: Response) => {
    const templates = await availabilityService.listTemplates(req.user!.userId);
    res.status(200).json({ success: true, data: { templates } });
  },

  // Handles GET /meta/timezones — returns available timezone options
  getTimezoneOptions: async (req: Request, res: Response) => {
    const timezones = await availabilityService.getTimezoneOptions();
    res.status(200).json({ success: true, data: { timezones } });
  },

  // Handles GET /meta/time-options — returns 30-min time-of-day options
  getTimeOptions: async (req: Request, res: Response) => {
    const timeOptions = await availabilityService.getTimeOptions();
    res.status(200).json({ success: true, data: { timeOptions } });
  },

  // Handles GET /:id — fetches a single template with its time blocks
  getTemplateById: async (req: Request, res: Response) => {
    const templateId = parseTemplateId(req.params.id);
    const template = await availabilityService.getTemplateById(req.user!.userId, templateId);
    res.status(200).json({ success: true, data: { template } });
  },

  // Handles PATCH /:id — updates template metadata
  updateTemplate: async (req: Request, res: Response) => {
    const templateId = parseTemplateId(req.params.id);
    const template = await availabilityService.updateTemplate(req.user!.userId, templateId, req.body);
    res.status(200).json({ success: true, data: { template } });
  },

  // Handles DELETE /:id — deletes a template
  deleteTemplate: async (req: Request, res: Response) => {
    const templateId = parseTemplateId(req.params.id);
    await availabilityService.deleteTemplate(req.user!.userId, templateId);
    res.status(200).json({ success: true, message: "Template deleted" });
  },

  // Handles PUT /:id/time-blocks — replaces all time blocks for a template
  replaceTimeBlocks: async (req: Request, res: Response) => {
    const templateId = parseTemplateId(req.params.id);
    const result = await availabilityService.replaceTimeBlocks(req.user!.userId, templateId, req.body);
    res.status(200).json({ success: true, data: { timeBlocks: result } });
  },

  // Handles POST /:id/date-overrides — creates a date override with optional blocks
  createDateOverride: async (req: Request, res: Response) => {
    const templateId = parseTemplateId(req.params.id);
    const override = await availabilityService.createDateOverride(req.user!.userId, templateId, req.body);
    res.status(201).json({ success: true, data: { override } });
  },

  // Handles GET /:id/date-overrides — lists all overrides for a template
  listDateOverrides: async (req: Request, res: Response) => {
    const templateId = parseTemplateId(req.params.id);
    const overrides = await availabilityService.listDateOverrides(req.user!.userId, templateId);
    res.status(200).json({ success: true, data: { overrides } });
  },

  // Handles DELETE /:id/date-overrides/:overrideId — deletes one override
  deleteDateOverride: async (req: Request, res: Response) => {
    const templateId = parseTemplateId(req.params.id);
    const overrideId = parseOverrideId(req.params.overrideId);
    await availabilityService.deleteDateOverride(req.user!.userId, templateId, overrideId);
    res.status(200).json({ success: true, message: "Date override deleted" });
  },
};