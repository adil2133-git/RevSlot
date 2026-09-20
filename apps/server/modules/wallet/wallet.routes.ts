import { Router } from "express";
import { requireReviewer } from "../../core/middlewares/auth.middleware.js";
import { catchAsync } from "../../core/utils/catchAsync.js";
import { walletController } from "./wallet.controller.js";

const router = Router();

router.use(requireReviewer);

router.get("/overview", catchAsync(walletController.getOverview));
router.post("/payout-profile", catchAsync(walletController.savePayoutProfile));
router.post("/request-payout", catchAsync(walletController.requestPayout));

export default router;
