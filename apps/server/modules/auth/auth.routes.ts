import { Router } from "express";

import { validate } from "../../core/middlewares/validate.middleware.js";
import { LoginSchema, RegisterSchema, ForgotPasswordSchema, ResetPasswordSchema, VerifyEmailSchema, ResendVerificationSchema, GoogleAuthSchema, UpdateUsernameSchema,  UpdateProfileSchema, ChangePasswordSchema } from "./auth.schema.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import { authController } from "./auth.controller.js";
import { requireAuth, requireAdmin } from "../../core/middlewares/auth.middleware.js";
import { loginLimiter, registerLimiter, refreshLimiter } from "../../core/middlewares/rateLimit.middleware.js";
import { uploadAvatar } from "../../core/middlewares/upload.middleware.js";

const router = Router();

router.post("/reviewer/register", registerLimiter, validate(RegisterSchema), catchAsync(authController.registerReviewer));
router.post("/reviewer/login", loginLimiter, validate(LoginSchema), catchAsync(authController.loginReviewer));
router.post("/admin/login", loginLimiter, validate(LoginSchema), catchAsync(authController.loginAdmin))
router.post("/refresh", refreshLimiter, catchAsync(authController.refreshToken));
router.post("/logout", catchAsync(authController.logout));

router.get("/me", requireAuth, catchAsync(authController.getMe));
router.patch("/profile", requireAuth, validate(UpdateProfileSchema), catchAsync(authController.updateProfile));
router.patch("/profile/username", requireAuth, validate(UpdateUsernameSchema), catchAsync(authController.updateUsername));
router.patch("/profile/password", requireAuth, validate(ChangePasswordSchema), catchAsync(authController.changePassword));
router.patch("/profile/avatar", requireAuth, uploadAvatar, catchAsync(authController.updateAvatar));

router.post("/forgot-password", validate(ForgotPasswordSchema), catchAsync(authController.forgotPassword));
router.post("/reset-password", validate(ResetPasswordSchema), catchAsync(authController.resetPassword));
router.post("/verify-email", validate(VerifyEmailSchema), catchAsync(authController.verifyEmail));
router.post("/resend-verification", validate(ResendVerificationSchema), catchAsync(authController.resendVerification));
router.post("/google", validate(GoogleAuthSchema), catchAsync(authController.googleAuth));

// for testing only
router.get("/admin/test", requireAdmin, (req, res) => {
    res.json({
      success: true,
      message: "Admin access granted",
      user: req.user,
    });
  }
);


export default router;