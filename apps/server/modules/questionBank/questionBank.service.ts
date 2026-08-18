import { eq, and, asc, sql } from "drizzle-orm";
import { db } from "../../config/db.js";
import { questionBanks } from "../../db/schema/questionBanks.js";
import { questions } from "../../db/schema/questions.js";
import { AppError } from "../../core/errors/AppError.js";
import type {
  CreateBankInput,
  UpdateBankInput,
  CreateQuestionInput,
  UpdateQuestionInput,
  ReorderQuestionsInput,
} from "./questionBank.schema.js";

// Every function takes reviewerId and checks it against the row's
// reviewer_id — a reviewer can only ever see/touch their own banks and
// questions. Not found + wrong owner both surface as 404, not 403 —
// no need to reveal that a bank ID belonging to someone else exists.

async function getOwnedBank(bankId: number, reviewerId: number) {
  const [bank] = await db
    .select()
    .from(questionBanks)
    .where(and(eq(questionBanks.id, bankId), eq(questionBanks.reviewerId, reviewerId)));

  if (!bank) {
    throw new AppError("Question bank not found", 404);
  }
  return bank;
}

export async function listBanks(reviewerId: number) {
  return db
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
}

export async function getBankWithQuestions(bankId: number, reviewerId: number) {
  const bank = await getOwnedBank(bankId, reviewerId);
  const bankQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.bankId, bankId))
    .orderBy(asc(questions.displayOrder), asc(questions.id));

  return { ...bank, questions: bankQuestions };
}

export async function createBank(reviewerId: number, input: CreateBankInput) {
  const existing = await db
    .select()
    .from(questionBanks)
    .where(and(eq(questionBanks.reviewerId, reviewerId), eq(questionBanks.name, input.name)));

  if (existing.length > 0) {
    // Matches the DB's own unique_bank_name constraint — caught here
    // first so it comes back as a clean 409, not a raw constraint error.
    throw new AppError("You already have a question bank with that name", 409);
  }

  const [bank] = await db.insert(questionBanks).values({
    reviewerId,
    name: input.name,
    description: input.description,
  }).returning();

  return bank;
}

export async function updateBank(bankId: number, reviewerId: number, input: UpdateBankInput) {
  await getOwnedBank(bankId, reviewerId);

  const [updated] = await db
    .update(questionBanks)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(questionBanks.id, bankId))
    .returning();

  return updated;
}

export async function deleteBank(bankId: number, reviewerId: number) {
  await getOwnedBank(bankId, reviewerId);
  // questions.bank_id has ON DELETE CASCADE — no manual cleanup needed.
  await db.delete(questionBanks).where(eq(questionBanks.id, bankId));
}

export async function addQuestion(bankId: number, reviewerId: number, input: CreateQuestionInput) {
  await getOwnedBank(bankId, reviewerId);

  const [question] = await db.insert(questions).values({
    bankId,
    questionText: input.questionText,
    description: input.description,
    displayOrder: input.displayOrder,
  }).returning();

  return question;
}

async function getOwnedQuestion(bankId: number, questionId: number, reviewerId: number) {
  await getOwnedBank(bankId, reviewerId); // confirms the bank itself is theirs

  const [question] = await db
    .select()
    .from(questions)
    .where(and(eq(questions.id, questionId), eq(questions.bankId, bankId)));

  if (!question) {
    throw new AppError("Question not found", 404);
  }
  return question;
}

export async function updateQuestion(
  bankId: number,
  questionId: number,
  reviewerId: number,
  input: UpdateQuestionInput
) {
  await getOwnedQuestion(bankId, questionId, reviewerId);

  const [updated] = await db
    .update(questions)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(questions.id, questionId))
    .returning();

  return updated;
}

export async function deleteQuestion(bankId: number, questionId: number, reviewerId: number) {
  await getOwnedQuestion(bankId, questionId, reviewerId);
  await db.delete(questions).where(eq(questions.id, questionId));
}

export async function reorderQuestions(
  bankId: number,
  reviewerId: number,
  input: ReorderQuestionsInput
) {
  await getOwnedBank(bankId, reviewerId);

  // Sequential updates, not a single batch statement — Drizzle doesn't
  // have a clean bulk-case-when helper here, and reorder lists are small
  // (a handful of questions per bank), so this stays simple over clever.
  for (const item of input.order) {
    await db
      .update(questions)
      .set({ displayOrder: item.displayOrder, updatedAt: new Date() })
      .where(and(eq(questions.id, item.id), eq(questions.bankId, bankId)));
  }

  return getBankWithQuestions(bankId, reviewerId);
}