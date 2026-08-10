import { Router } from "express";

import { validate } from "../../core/middlewares/validate.middleware.js";
import { LoginSchema, RegisterSchema } from "./auth.schema.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import { authController } from "./auth.controller.js";
import { requireAuth, requireRole } from "../../core/middlewares/auth.middleware.js";

const router = Router();

router.post("/reviewer/register", validate(RegisterSchema), catchAsync(authController.registerReviewer));
router.post("/reviewer/login", validate(LoginSchema), catchAsync(authController.loginReviewer));
router.post("/admin/login", validate(LoginSchema), catchAsync(authController.loginAdmin))

// for testing only
router.get("/admin/test", requireAuth, requireRole("admin"),(req, res) => {
    res.json({
      success: true,
      message: "Admin access granted",
      user: req.user,
    });
  }
);

export default router;