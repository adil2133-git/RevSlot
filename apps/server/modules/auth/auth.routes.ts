import { Router } from "express";

import { validate } from "../../core/middlewares/validate.middleware.js";
import { LoginSchema, RegisterSchema } from "./auth.schema.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import { authController } from "./auth.controller.js";
import { requireAuth, requireRole } from "../../core/middlewares/auth.middleware.js";
import { loginLimiter, registerLimiter, refreshLimiter } from "../../core/middlewares/rateLimit.middleware.js";

const router = Router();

router.post("/reviewer/register", registerLimiter, validate(RegisterSchema), catchAsync(authController.registerReviewer));
router.post("/reviewer/login", loginLimiter, validate(LoginSchema), catchAsync(authController.loginReviewer));
router.post("/admin/login", loginLimiter, validate(LoginSchema), catchAsync(authController.loginAdmin))
router.post("/refresh", refreshLimiter, catchAsync(authController.refreshToken));
router.post("/logout", requireAuth, catchAsync(authController.logout));
router.get("/me", requireAuth, catchAsync(authController.getMe));

export default router;