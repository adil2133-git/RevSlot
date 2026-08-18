import { z } from "zod";

export const CreateBankSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(1000).optional(),
});

export const UpdateBankSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  description: z.string().trim().max(1000).optional(),
});

export const CreateQuestionSchema = z.object({
  questionText: z.string().trim().min(1),
  description: z.string().trim().max(1000).optional(),
  displayOrder: z.number().int().optional(),
});

export const UpdateQuestionSchema = z.object({
  questionText: z.string().trim().min(1).optional(),
  description: z.string().trim().max(1000).optional(),
  displayOrder: z.number().int().optional(),
});

// Body: [{ id, displayOrder }, ...] — bulk reorder in one request rather
// than N individual PATCH calls when a reviewer drags questions around.
export const ReorderQuestionsSchema = z.object({
  order: z
    .array(
      z.object({
        id: z.number().int(),
        displayOrder: z.number().int(),
      })
    )
    .min(1),
});

export type CreateBankInput = z.infer<typeof CreateBankSchema>;
export type UpdateBankInput = z.infer<typeof UpdateBankSchema>;
export type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof UpdateQuestionSchema>;
export type ReorderQuestionsInput = z.infer<typeof ReorderQuestionsSchema>;