import { Router } from "express";
import * as feedbackController from "./feedback.controller.js";
import { validate } from "../../core/middlewares/validate.middleware.js";
import { requireReviewer } from "../../core/middlewares/auth.middleware.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import { CreateFormSchema, UpdateFormSchema, SubmitFeedbackSchema, UpdateFeedbackSchema } from "./feedback.schema.js";

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

// Intern review history — kept at its own top-level path (/api/intern-history)
// rather than under /api/bookings, so it never risks colliding with a
// GET /api/bookings/:id route depending on registration order.
const internHistoryRouter = Router();
internHistoryRouter.use(requireReviewer);
internHistoryRouter.get("/", catchAsync(feedbackController.getInternHistory));

const feedbackListRouter = Router();
feedbackListRouter.use(requireReviewer);
feedbackListRouter.get("/pending", catchAsync(feedbackController.listPendingFeedback));
feedbackListRouter.get("/", catchAsync(feedbackController.listFeedback));

export { bookingFeedbackRouter, internHistoryRouter, feedbackListRouter };
export default formRouter;