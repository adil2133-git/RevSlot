import { Router } from "express";
import { requireReviewer } from "../../core/middlewares/auth.middleware.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import { calendarController } from "./calendar.controller.js";

const router = Router();

router.get(
  "/google/connect",
  requireReviewer,
  catchAsync(calendarController.getConnectUrl)
);

router.get(
  "/google/status",
  requireReviewer,
  catchAsync(calendarController.getStatus)
);

router.post(
  "/google/disconnect",
  requireReviewer,
  catchAsync(calendarController.disconnect)
);

// Public — Google redirects the reviewer's browser here directly after
// consent. The signed `state` parameter proves the request is legitimate.
router.get(
  "/google/callback",
  catchAsync(calendarController.handleCallback)
);

export default router;