import { Router } from "express";
import { requireReviewer } from "../../core/middlewares/auth.middleware.js";
import { validate } from "../../core/middlewares/validate.middleware.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import { bookingFieldsController } from "./bookingFields.controller.js";
import { ReplaceBookingFieldsSchema } from "./bookingFields.validation.js";

const router = Router();

router.use(requireReviewer);

router.get("/", catchAsync(bookingFieldsController.getBookingFields));
router.put("/", validate(ReplaceBookingFieldsSchema), catchAsync(bookingFieldsController.replaceBookingFields));

export default router;