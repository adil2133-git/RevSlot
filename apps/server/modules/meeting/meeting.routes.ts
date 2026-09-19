import { Router } from "express";

import { catchAsync } from "../../core/utils/catchAsync.js";
import { meetingController } from "./meeting.controller.js";

const router = Router();

router.get(
  "/:bookingId",
  catchAsync(meetingController.getInfo)
);

export default router;
