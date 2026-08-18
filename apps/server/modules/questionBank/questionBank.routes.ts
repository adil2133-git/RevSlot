import { Router } from "express";
import * as questionBankController from "./questionBank.controller.js";
import { validate } from "../../core/middlewares/validate.middleware.js";
import { requireAuth, requireRole } from "../../core/middlewares/auth.middleware.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import {
  CreateBankSchema,
  UpdateBankSchema,
  CreateQuestionSchema,
  UpdateQuestionSchema,
  ReorderQuestionsSchema,
} from "./questionBank.schema.js";

const router = Router();

// Question banks are reviewer-only end to end — advisors/interns never
// see them (doc section 3.4), so every route here requires both a valid
// session and the reviewer role, not just requireAuth alone.
router.use(requireAuth, requireRole("reviewer"));

router.get("/", catchAsync(questionBankController.listBanks));
router.post("/", validate(CreateBankSchema), catchAsync(questionBankController.createBank));
router.get("/:bankId", catchAsync(questionBankController.getBank));
router.patch("/:bankId", validate(UpdateBankSchema), catchAsync(questionBankController.updateBank));
router.delete("/:bankId", catchAsync(questionBankController.deleteBank));

router.post(
  "/:bankId/questions",
  validate(CreateQuestionSchema),
  catchAsync(questionBankController.addQuestion)
);
router.patch(
  "/:bankId/questions/:questionId",
  validate(UpdateQuestionSchema),
  catchAsync(questionBankController.updateQuestion)
);
router.delete(
  "/:bankId/questions/:questionId",
  catchAsync(questionBankController.deleteQuestion)
);
router.post(
  "/:bankId/questions/reorder",
  validate(ReorderQuestionsSchema),
  catchAsync(questionBankController.reorderQuestions)
);

export default router;