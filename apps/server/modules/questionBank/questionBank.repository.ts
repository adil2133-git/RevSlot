import { eq, and, asc, sql, type InferInsertModel } from "drizzle-orm";
import { db } from "../../config/db.js";
import { questionBanks } from "./questionBanks.schema.js";
import { questions } from "./questions.schema.js";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | Transaction;

export type NewQuestionBank = InferInsertModel<typeof questionBanks>;
export type NewQuestion = InferInsertModel<typeof questions>;

export const findBankByIdAndReviewerRepo = async (
  bankId: number,
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [bank] = await tx
    .select()
    .from(questionBanks)
    .where(and(eq(questionBanks.id, bankId), eq(questionBanks.reviewerId, reviewerId)));
  return bank;
};

export const listBanksWithQuestionCountRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  return await tx
    .select({
      id: questionBanks.id,
      reviewerId: questionBanks.reviewerId,
      name: questionBanks.name,
      description: questionBanks.description,
      createdAt: questionBanks.createdAt,
      updatedAt: questionBanks.updatedAt,
      questionCount: sql<number>`count(${questions.id})::int`,
    })
    .from(questionBanks)
    .leftJoin(questions, eq(questions.bankId, questionBanks.id))
    .where(eq(questionBanks.reviewerId, reviewerId))
    .groupBy(questionBanks.id)
    .orderBy(asc(questionBanks.name));
};

export const findQuestionsByBankIdRepo = async (
  bankId: number,
  tx: DbOrTx = db
) => {
  return await tx
    .select()
    .from(questions)
    .where(eq(questions.bankId, bankId))
    .orderBy(asc(questions.displayOrder), asc(questions.id));
};

export const findBankByNameAndReviewerRepo = async (
  name: string,
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [bank] = await tx
    .select()
    .from(questionBanks)
    .where(and(eq(questionBanks.reviewerId, reviewerId), eq(questionBanks.name, name)));
  return bank;
};

export const createBankRepo = async (
  data: {
    reviewerId: number;
    name: string;
    description?: string | undefined;
  },
  tx: DbOrTx = db
) => {
  const [bank] = await tx
    .insert(questionBanks)
    .values({
      reviewerId: data.reviewerId,
      name: data.name,
      description: data.description,
    })
    .returning();
  return bank;
};

export const updateBankRepo = async (
  bankId: number,
  data: {
    name?: string | undefined;
    description?: string | undefined;
  },
  tx: DbOrTx = db
) => {
  const [updated] = await tx
    .update(questionBanks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(questionBanks.id, bankId))
    .returning();
  return updated;
};

export const deleteBankRepo = async (bankId: number, tx: DbOrTx = db) => {
  return await tx.delete(questionBanks).where(eq(questionBanks.id, bankId));
};

export const createQuestionRepo = async (
  data: {
    bankId: number;
    questionText: string;
    description?: string | undefined;
    displayOrder?: number | undefined;
  },
  tx: DbOrTx = db
) => {
  const [question] = await tx
    .insert(questions)
    .values({
      bankId: data.bankId,
      questionText: data.questionText,
      description: data.description,
      displayOrder: data.displayOrder,
    })
    .returning();
  return question;
};

export const findQuestionByIdAndBankIdRepo = async (
  questionId: number,
  bankId: number,
  tx: DbOrTx = db
) => {
  const [question] = await tx
    .select()
    .from(questions)
    .where(and(eq(questions.id, questionId), eq(questions.bankId, bankId)));
  return question;
};

export const updateQuestionRepo = async (
  questionId: number,
  data: {
    questionText?: string | undefined;
    description?: string | undefined;
    displayOrder?: number | undefined;
  },
  tx: DbOrTx = db
) => {
  const [updated] = await tx
    .update(questions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(questions.id, questionId))
    .returning();
  return updated;
};

export const deleteQuestionRepo = async (questionId: number, tx: DbOrTx = db) => {
  return await tx.delete(questions).where(eq(questions.id, questionId));
};

export const updateQuestionDisplayOrderRepo = async (
  questionId: number,
  bankId: number,
  displayOrder: number,
  tx: DbOrTx = db
) => {
  return await tx
    .update(questions)
    .set({ displayOrder, updatedAt: new Date() })
    .where(and(eq(questions.id, questionId), eq(questions.bankId, bankId)));
};

export const questionBankRepository = {
  findBankByIdAndReviewer: findBankByIdAndReviewerRepo,
  listBanksWithQuestionCount: listBanksWithQuestionCountRepo,
  findQuestionsByBankId: findQuestionsByBankIdRepo,
  findBankByNameAndReviewer: findBankByNameAndReviewerRepo,
  createBank: createBankRepo,
  updateBank: updateBankRepo,
  deleteBank: deleteBankRepo,
  createQuestion: createQuestionRepo,
  findQuestionByIdAndBankId: findQuestionByIdAndBankIdRepo,
  updateQuestion: updateQuestionRepo,
  deleteQuestion: deleteQuestionRepo,
  updateQuestionDisplayOrder: updateQuestionDisplayOrderRepo,
};
