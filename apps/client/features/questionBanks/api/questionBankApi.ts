import api from "@/lib/axios";
import type {
  QuestionBank,
  QuestionBankWithQuestions,
  Question,
  CreateBankPayload,
  UpdateBankPayload,
  CreateQuestionPayload,
  UpdateQuestionPayload,
  ReorderPayload,
} from "../types";

type DataEnvelope<T> = { success: true; data: T };
type MessageEnvelope = { success: true; message: string };

export async function listBanks() {
  const { data } = await api.get<DataEnvelope<{ banks: QuestionBank[] }>>("/question-banks");
  return data.data.banks;
}

export async function getBank(bankId: number) {
  const { data } = await api.get<DataEnvelope<{ bank: QuestionBankWithQuestions }>>(
    `/question-banks/${bankId}`
  );
  return data.data.bank;
}

export async function createBank(payload: CreateBankPayload) {
  const { data } = await api.post<DataEnvelope<{ bank: QuestionBank }>>(
    "/question-banks",
    payload
  );
  return data.data.bank;
}

export async function updateBank(bankId: number, payload: UpdateBankPayload) {
  const { data } = await api.patch<DataEnvelope<{ bank: QuestionBank }>>(
    `/question-banks/${bankId}`,
    payload
  );
  return data.data.bank;
}

export async function deleteBank(bankId: number) {
  await api.delete<MessageEnvelope>(`/question-banks/${bankId}`);
}

export async function addQuestion(bankId: number, payload: CreateQuestionPayload) {
  const { data } = await api.post<DataEnvelope<{ question: Question }>>(
    `/question-banks/${bankId}/questions`,
    payload
  );
  return data.data.question;
}

export async function updateQuestion(
  bankId: number,
  questionId: number,
  payload: UpdateQuestionPayload
) {
  const { data } = await api.patch<DataEnvelope<{ question: Question }>>(
    `/question-banks/${bankId}/questions/${questionId}`,
    payload
  );
  return data.data.question;
}

export async function deleteQuestion(bankId: number, questionId: number) {
  await api.delete<MessageEnvelope>(`/question-banks/${bankId}/questions/${questionId}`);
}

export async function reorderQuestions(bankId: number, payload: ReorderPayload) {
  const { data } = await api.post<DataEnvelope<{ bank: QuestionBankWithQuestions }>>(
    `/question-banks/${bankId}/questions/reorder`,
    payload
  );
  return data.data.bank;
}