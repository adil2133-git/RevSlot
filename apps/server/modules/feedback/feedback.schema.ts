import { z } from "zod";

const FieldTypeEnum = z.enum(["text", "textarea", "number", "select"]);
export const UnderstandingLevelEnum = z.enum([
  "excellent", "good", "average", "needs_improvement",
]);

export const FormFieldSchema = z
  .object({
    label: z.string().trim().min(1).max(150),
    fieldType: FieldTypeEnum,
    options: z.array(z.string().trim().min(1)).optional(),
    required: z.boolean().optional(),
    displayOrder: z.number().int().optional(),
  })
  .refine((f) => f.fieldType !== "select" || (f.options && f.options.length > 0), {
    message: "Select fields need at least one option",
    path: ["options"],
  });

export const CreateFormSchema = z.object({
  name: z.string().trim().min(1).max(150),
  taskMarkEnabled: z.boolean().optional().default(false),
  fields: z.array(FormFieldSchema).max(20).optional().default([]),
  questionIds: z.array(z.number().int().positive()).max(100).optional(),
});

export const UpdateFormSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  taskMarkEnabled: z.boolean().optional(),
  fields: z.array(FormFieldSchema).max(20).optional(),
  questionIds: z.array(z.number().int().positive()).max(100).optional(),
});

export const SubmitFeedbackSchema = z
  .object({
    formId: z.number().int().positive(),
    isNoShow: z.boolean().optional().default(false),
    reviewMark: z.number().min(1).max(10).multipleOf(0.5).optional(),
    understandingLevel: UnderstandingLevelEnum.optional(),
    taskMark: z.number().min(1).max(10).multipleOf(0.5).optional(),
    comments: z.string().trim().max(3000).optional(),
    customFieldValues: z.record(z.string(), z.string().max(1000)).optional().default({}),
  })
  .refine(
    (data) => data.isNoShow || (data.reviewMark !== undefined && data.understandingLevel !== undefined),
    { message: "Review mark and understanding level are required unless marking as no-show", path: ["reviewMark"] }
  );

export const UpdateFeedbackSchema = z
  .object({
    reviewMark: z.number().min(1).max(10).multipleOf(0.5).optional(),
    understandingLevel: UnderstandingLevelEnum.optional(),
    taskMark: z.number().min(1).max(10).multipleOf(0.5).optional(),
    comments: z.string().trim().max(3000).optional(),
    customFieldValues: z.record(z.string(), z.string().max(1000)).optional().default({}),
  });

export const InternHistoryQuerySchema = z.object({
  internName: z.string().trim().min(1),
  batch: z.string().trim().min(1),
  excludeBookingId: z.coerce.number().int().optional(),
});

export const ListFeedbackQuerySchema = z.object({
  search: z.string().trim().min(1).max(150).optional(),
  formId: z.coerce.number().int().positive().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(50).optional().default(20),
});

export type FormFieldInput = z.infer<typeof FormFieldSchema>;
export type CreateFormInput = z.infer<typeof CreateFormSchema>;
export type UpdateFormInput = z.infer<typeof UpdateFormSchema>;
export type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackSchema>;
export type UpdateFeedbackInput = z.infer<typeof UpdateFeedbackSchema>;
export type InternHistoryQueryInput = z.infer<typeof InternHistoryQuerySchema>;
export type ListFeedbackQueryInput = z.infer<typeof ListFeedbackQuerySchema>;