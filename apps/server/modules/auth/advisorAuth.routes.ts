import { Router } from "express";
import { advisorAuthController } from "./advisorAuth.controller.js";
import { catchAsync } from "../../core/utils/catchAsync.js";

const router = Router();

router.post("/send-otp", catchAsync(advisorAuthController.sendOtp));
router.post("/verify-otp", catchAsync(advisorAuthController.verifyOtp));

export default router;
