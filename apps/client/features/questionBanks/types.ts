export type QuestionBank = {
  id: number;
  reviewerId: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  questionCount?: number;
};

export type Question = {
  id: number;
  bankId: number;
  questionText: string;
  description: string | null;
  displayOrder: number | null;
  createdAt: string;
  updatedAt: string;
};

export type QuestionBankWithQuestions = QuestionBank & {
  questions: Question[];
};

export type CreateBankPayload = {
  name: string;
  description?: string;
};

export type UpdateBankPayload = {
  name?: string;
  description?: string;
};

export type CreateQuestionPayload = {
  questionText: string;
  description?: string;
  displayOrder?: number;
};

export type UpdateQuestionPayload = {
  questionText?: string;
  description?: string;
  displayOrder?: number;
};

export type ReorderPayload = {
  order: { id: number; displayOrder: number }[];
};