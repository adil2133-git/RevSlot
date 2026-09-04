import { z } from "zod";

const FieldTypeEnum = z.enum(["text", "textarea", "number", "select"]);

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
  fields: z.array(FormFieldSchema).max(20).optional().default([]),
});

export const UpdateFormSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  // When provided, this is a full replace of the form's custom fields
  // (see feedback.service.ts updateForm) — not a partial patch list.
  fields: z.array(FormFieldSchema).max(20).optional(),
});

export const SubmitFeedbackSchema = z
  .object({
    isNoShow: z.boolean().optional().default(false),
    reviewMark: z.number().min(1).max(10).multipleOf(0.5).optional(),
    taskMark: z.number().min(1).max(10).multipleOf(0.5).optional(),
    comments: z.string().trim().max(3000).optional(),
    customFieldValues: z.record(z.string(), z.string().max(1000)).optional().default({}),
  })
  .refine((data) => data.isNoShow || (data.reviewMark !== undefined && data.taskMark !== undefined), {
    message: "Review mark and task mark are required unless marking as no-show",
    path: ["reviewMark"],
  });

export const InternHistoryQuerySchema = z.object({
  internName: z.string().trim().min(1),
  batch: z.string().trim().min(1),
  excludeBookingId: z.coerce.number().int().optional(),
});

export type FormFieldInput = z.infer<typeof FormFieldSchema>;
export type CreateFormInput = z.infer<typeof CreateFormSchema>;
export type UpdateFormInput = z.infer<typeof UpdateFormSchema>;
export type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackSchema>;
export type InternHistoryQueryInput = z.infer<typeof InternHistoryQuerySchema>;