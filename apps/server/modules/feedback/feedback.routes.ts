import { Router } from "express";
import * as feedbackController from "./feedback.controller.js";
import { validate } from "../../core/middlewares/validate.middleware.js";
import { requireReviewer } from "../../core/middlewares/auth.middleware.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import { CreateFormSchema, UpdateFormSchema, SubmitFeedbackSchema, UpdateFeedbackSchema, UpdatePendingQuestionStatusSchema } from "./feedback.validation.js";

// Feedback form CRUD — mount at /api/feedback-forms in server.ts.
const formRouter = Router();
formRouter.use(requireReviewer);
formRouter.get("/", catchAsync(feedbackController.listForms));
formRouter.post("/", validate(CreateFormSchema), catchAsync(feedbackController.createForm));
formRouter.get("/:formId", catchAsync(feedbackController.getForm));
formRouter.patch("/:formId", validate(UpdateFormSchema), catchAsync(feedbackController.updateForm));
formRouter.delete("/:formId", catchAsync(feedbackController.deleteForm));
formRouter.post("/:formId/reactivate", catchAsync(feedbackController.reactivateForm));

const bookingFeedbackRouter = Router();
bookingFeedbackRouter.use(requireReviewer);

bookingFeedbackRouter.post(
  "/:id/feedback",
  validate(SubmitFeedbackSchema),
  catchAsync(feedbackController.submitFeedback)
);
bookingFeedbackRouter.patch(
  "/:id/feedback",
  validate(UpdateFeedbackSchema),
  catchAsync(feedbackController.updateFeedback)
);
bookingFeedbackRouter.get("/:id/feedback", catchAsync(feedbackController.getFeedback));

bookingFeedbackRouter.patch(
  "/:id/feedback/pending-questions/:pendingQuestionId",
  validate(UpdatePendingQuestionStatusSchema),
  catchAsync(feedbackController.updatePendingQuestionStatus)
);

const internHistoryRouter = Router();
internHistoryRouter.use(requireReviewer);
internHistoryRouter.get("/", catchAsync(feedbackController.getInternHistory));

const feedbackListRouter = Router();
feedbackListRouter.use(requireReviewer);
feedbackListRouter.get("/pending", catchAsync(feedbackController.listPendingFeedback));
feedbackListRouter.get("/", catchAsync(feedbackController.listFeedback));

export { bookingFeedbackRouter, internHistoryRouter, feedbackListRouter };
export default formRouter;