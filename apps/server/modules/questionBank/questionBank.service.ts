import { AppError } from "../../core/errors/AppError.js";
import type {
  CreateBankInput,
  UpdateBankInput,
  CreateQuestionInput,
  UpdateQuestionInput,
  ReorderQuestionsInput,
} from "./questionBank.validation.js";
import {
  findBankByIdAndReviewerRepo,
  listBanksWithQuestionCountRepo,
  findQuestionsByBankIdRepo,
  findBankByNameAndReviewerRepo,
  createBankRepo,
  updateBankRepo,
  deleteBankRepo,
  createQuestionRepo,
  findQuestionByIdAndBankIdRepo,
  updateQuestionRepo,
  deleteQuestionRepo,
  updateQuestionDisplayOrderRepo,
} from "./questionBank.repository.js";

// Every function takes reviewerId and checks it against the row's
// reviewer_id — a reviewer can only ever see/touch their own banks and
// questions. Not found + wrong owner both surface as 404, not 403 —
// no need to reveal that a bank ID belonging to someone else exists.

async function getOwnedBank(bankId: number, reviewerId: number) {
  const bank = await findBankByIdAndReviewerRepo(bankId, reviewerId);
  if (!bank) {
    throw new AppError("Question bank not found", 404);
  }
  return bank;
}

export async function listBanks(reviewerId: number) {
  return await listBanksWithQuestionCountRepo(reviewerId);
}

export async function getBankWithQuestions(bankId: number, reviewerId: number) {
  const bank = await getOwnedBank(bankId, reviewerId);
  const bankQuestions = await findQuestionsByBankIdRepo(bankId);

  return { ...bank, questions: bankQuestions };
}

export async function createBank(reviewerId: number, input: CreateBankInput) {
  const existing = await findBankByNameAndReviewerRepo(input.name, reviewerId);

  if (existing) {
    // Matches the DB's own unique_bank_name constraint — caught here
    // first so it comes back as a clean 409, not a raw constraint error.
    throw new AppError("You already have a question bank with that name", 409);
  }

  const bank = await createBankRepo({
    reviewerId,
    name: input.name,
    description: input.description,
  });

  return bank;
}

export async function updateBank(bankId: number, reviewerId: number, input: UpdateBankInput) {
  await getOwnedBank(bankId, reviewerId);

  const updated = await updateBankRepo(bankId, input);
  return updated;
}

export async function deleteBank(bankId: number, reviewerId: number) {
  await getOwnedBank(bankId, reviewerId);
  // questions.bank_id has ON DELETE CASCADE — no manual cleanup needed.
  await deleteBankRepo(bankId);
}

export async function addQuestion(bankId: number, reviewerId: number, input: CreateQuestionInput) {
  await getOwnedBank(bankId, reviewerId);

  const question = await createQuestionRepo({
    bankId,
    questionText: input.questionText,
    description: input.description,
    displayOrder: input.displayOrder,
  });

  return question;
}

async function getOwnedQuestion(bankId: number, questionId: number, reviewerId: number) {
  await getOwnedBank(bankId, reviewerId); // confirms the bank itself is theirs

  const question = await findQuestionByIdAndBankIdRepo(questionId, bankId);
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

  const updated = await updateQuestionRepo(questionId, input);
  return updated;
}

export async function deleteQuestion(bankId: number, questionId: number, reviewerId: number) {
  await getOwnedQuestion(bankId, questionId, reviewerId);
  await deleteQuestionRepo(questionId);
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
    await updateQuestionDisplayOrderRepo(item.id, bankId, item.displayOrder);
  }

  return getBankWithQuestions(bankId, reviewerId);
}