import { Router } from "express";
import * as feedbackController from "./feedback.controller.js";
import { validate } from "../../core/middlewares/validate.middleware.js";
import { requireReviewer } from "../../core/middlewares/auth.middleware.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import { CreateFormSchema, UpdateFormSchema, SubmitFeedbackSchema } from "./Feedback.schema.js";

// Feedback form CRUD — mount at /api/feedback-forms in server.ts.
const formRouter = Router();
formRouter.use(requireReviewer);
formRouter.get("/", catchAsync(feedbackController.listForms));
formRouter.post("/", validate(CreateFormSchema), catchAsync(feedbackController.createForm));
formRouter.get("/:formId", catchAsync(feedbackController.getForm));
formRouter.patch("/:formId", validate(UpdateFormSchema), catchAsync(feedbackController.updateForm));
formRouter.delete("/:formId", catchAsync(feedbackController.deleteForm));

// Feedback submit/fetch, nested under bookings — mount at /api/bookings
// in server.ts, alongside the existing booking routes (Express merges
// multiple routers mounted on the same base path).
const bookingFeedbackRouter = Router();
bookingFeedbackRouter.use(requireReviewer);
bookingFeedbackRouter.post(
  "/:id/feedback",
  validate(SubmitFeedbackSchema),
  catchAsync(feedbackController.submitFeedback)
);
bookingFeedbackRouter.get("/:id/feedback", catchAsync(feedbackController.getFeedback));

// Intern review history — kept at its own top-level path (/api/intern-history)
// rather than under /api/bookings, so it never risks colliding with a
// GET /api/bookings/:id route depending on registration order.
const internHistoryRouter = Router();
internHistoryRouter.use(requireReviewer);
internHistoryRouter.get("/", catchAsync(feedbackController.getInternHistory));

export { bookingFeedbackRouter, internHistoryRouter };
export default formRouter;