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

// Minimal guard against missing/empty fields, to avoid a raw DB crash
const requireField = (value: unknown, fieldName: string) => {
  if (value === undefined || value === null || value === "") {
    throw new AppError(`${fieldName} is required`, 400);
  }
};

export const availabilityController = {
  // Handles POST / — creates a new availability template
  createTemplate: async (req: Request, res: Response) => {
    requireField(req.body?.name, "name");

    const template = await availabilityService.createTemplate(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: { template } });
  },

  // Handles GET / — lists all templates for the logged-in reviewer
  listTemplates: async (req: Request, res: Response) => {
    const templates = await availabilityService.listTemplates(req.user!.userId);
    res.status(200).json({ success: true, data: { templates } });
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

    const blocks = req.body?.blocks;
    if (!Array.isArray(blocks)) {
      throw new AppError("blocks must be an array", 400);
    }

    const result = await availabilityService.replaceTimeBlocks(req.user!.userId, templateId, blocks);
    res.status(200).json({ success: true, data: { timeBlocks: result } });
  },
};