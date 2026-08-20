import type { Request, Response } from "express";
import * as questionBankService from "./questionBank.service.js";

// req.user is guaranteed present here — every route below sits behind requireReviewer.
function reviewerId(req: Request): number {
  return req.user!.userId;
}

export async function listBanks(req: Request, res: Response) {
  const banks = await questionBankService.listBanks(reviewerId(req));
  res.status(200).json({ success: true, data: { banks } });
}

export async function getBank(req: Request, res: Response) {
  const bankId = Number(req.params.bankId);
  const bank = await questionBankService.getBankWithQuestions(bankId, reviewerId(req));
  res.status(200).json({ success: true, data: { bank } });
}

export async function createBank(req: Request, res: Response) {
  const bank = await questionBankService.createBank(reviewerId(req), req.body);
  res.status(201).json({ success: true, data: { bank } });
}

export async function updateBank(req: Request, res: Response) {
  const bankId = Number(req.params.bankId);
  const bank = await questionBankService.updateBank(bankId, reviewerId(req), req.body);
  res.status(200).json({ success: true, data: { bank } });
}

export async function deleteBank(req: Request, res: Response) {
  const bankId = Number(req.params.bankId);
  await questionBankService.deleteBank(bankId, reviewerId(req));
  res.status(200).json({ success: true, message: "Question bank deleted" });
}

export async function addQuestion(req: Request, res: Response) {
  const bankId = Number(req.params.bankId);
  const question = await questionBankService.addQuestion(bankId, reviewerId(req), req.body);
  res.status(201).json({ success: true, data: { question } });
}

export async function updateQuestion(req: Request, res: Response) {
  const bankId = Number(req.params.bankId);
  const questionId = Number(req.params.questionId);
  const question = await questionBankService.updateQuestion(
    bankId,
    questionId,
    reviewerId(req),
    req.body
  );
  res.status(200).json({ success: true, data: { question } });
}

export async function deleteQuestion(req: Request, res: Response) {
  const bankId = Number(req.params.bankId);
  const questionId = Number(req.params.questionId);
  await questionBankService.deleteQuestion(bankId, questionId, reviewerId(req));
  res.status(200).json({ success: true, message: "Question deleted" });
}

export async function reorderQuestions(req: Request, res: Response) {
  const bankId = Number(req.params.bankId);
  const bank = await questionBankService.reorderQuestions(bankId, reviewerId(req), req.body);
  res.status(200).json({ success: true, data: { bank } });
}