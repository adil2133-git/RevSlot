import { db } from "../../config/db.js";
import { auditLogService } from "../auditLog/auditLog.service.js";
import { emailService } from "../../services/email.service.js";
import { payoutProcessedTemplate, payoutProcessedTemplateData } from "../../emails/templates/payoutProcessed.js";
import { notificationService } from "../notification/notification.service.js";
import { AppError } from "../../core/errors/AppError.js";
import {
  listPayoutRequestsRepo,
  findPayoutRequestByIdRepo,
  approvePayoutRequestRepo,
  rejectPayoutRequestRepo,
  findRecentReviewerWithdrawalTxRepo,
  updateWalletTransactionStatusAndDescriptionRepo,
  findReviewerWalletByReviewerIdRepo,
  refundReviewerWalletBalanceRepo,
  insertFailedWithdrawalTxRepo,
  findReviewerContactByIdRepo,
  findAdminNameByIdRepo,
} from "./admin.repository.js";

export const adminPayoutsService = {
  listPayoutRequests: async (params: {
    status?: "requested" | "completed" | "rejected" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
  }) => {
    return listPayoutRequestsRepo(params);
  },

  processPayout: async (
    payoutId: number,
    adminId: number,
    data: {
      action: "approve" | "reject";
      transactionReference?: string | undefined;
      adminNotes?: string | undefined;
    }
  ) => {
    const payout = await findPayoutRequestByIdRepo(payoutId);

    if (!payout) {
      throw new AppError("Payout request not found", 404);
    }

    if (payout.status !== "requested") {
      throw new AppError(`This payout has already been marked as ${payout.status}`, 400);
    }

    const result = await db.transaction(async (tx) => {
      if (data.action === "approve") {
        if (!data.transactionReference?.trim()) {
          throw new AppError("Transaction reference / UTR number is required to approve a payout", 400);
        }

        const updated = await approvePayoutRequestRepo(
          payoutId,
          adminId,
          data.transactionReference.trim(),
          data.adminNotes || "Approved and transferred",
          tx
        );

        // Update corresponding pending wallet transaction
        const recentTx = await findRecentReviewerWithdrawalTxRepo(payout.reviewerId, tx);

        if (recentTx && recentTx.type === "withdrawal") {
          await updateWalletTransactionStatusAndDescriptionRepo(
            recentTx.id,
            "completed",
            `${recentTx.description} (Ref: ${data.transactionReference.trim()})`,
            tx
          );
        }

        return updated;
      } else {
        // Reject: refund funds back to reviewer's availableBalance
        const wallet = await findReviewerWalletByReviewerIdRepo(payout.reviewerId, tx);

        if (wallet) {
          await refundReviewerWalletBalanceRepo(
            wallet.id,
            payout.amount,
            wallet.availableBalance,
            wallet.withdrawnBalance,
            tx
          );
        }

        const updated = await rejectPayoutRequestRepo(
          payoutId,
          adminId,
          data.adminNotes || "Rejected by administrator",
          tx
        );

        // Add compensation refund ledger entry
        await insertFailedWithdrawalTxRepo(
          payout.reviewerId,
          payout.amount,
          `Payout rejected (Funds restored): ₹${(payout.amount / 100).toFixed(2)} refunded to available balance. Reason: ${data.adminNotes || "Admin rejection"}`,
          tx
        );

        return updated;
      }
    });

    // Send in-app notification & email to reviewer
    const reviewer = await findReviewerContactByIdRepo(payout.reviewerId);

    if (reviewer && payout) {
      const amountRupees = (payout.amount / 100).toFixed(2);
      const isApproved = data.action === "approve";

      // 1. In-app notification (live socket)
      notificationService.createNotification({
        reviewerId: payout.reviewerId,
        type: isApproved ? "payout_processed" : "payout_rejected",
        title: isApproved ? "Payout completed" : "Payout rejected",
        message: isApproved
          ? `Your withdrawal of ₹${amountRupees} was completed (Ref: ${data.transactionReference?.trim()})`
          : `Your withdrawal of ₹${amountRupees} was rejected: ${data.adminNotes || "Administrative decision"}. Funds returned to balance.`,
      }).catch((err) => console.error("[Payout] Notification error:", err));

      // 2. Email alert
      const { html: fallbackHtml } = payoutProcessedTemplate({
        reviewerName: reviewer.name,
        amountPaise: payout.amount,
        status: isApproved ? "completed" : "rejected",
        transactionReference: data.transactionReference,
        adminNotes: data.adminNotes,
      });
      const { templateId, subject, variables } = payoutProcessedTemplateData({
        reviewerName: reviewer.name,
        amountPaise: payout.amount,
        status: isApproved ? "completed" : "rejected",
        transactionReference: data.transactionReference,
        adminNotes: data.adminNotes,
      });
      emailService.sendTemplateEmail({ to: reviewer.email, templateId, subject, variables, fallbackHtml }).catch((err) => {
        console.error("[Payout] Email error:", err);
      });
    }

    // Record Audit Log for Payout Action
    try {
      const actorAdmin = await findAdminNameByIdRepo(adminId);
      await auditLogService.recordAuditLog({
        actorId: adminId,
        actorRole: "admin",
        actorName: actorAdmin?.name ?? "Admin",
        action: data.action === "approve" ? "payout.approved" : "payout.rejected",
        targetType: "payout",
        targetId: payoutId,
        metadata: {
          reviewerId: payout.reviewerId,
          reviewerName: reviewer?.name,
          amountPaise: payout.amount,
          amountRupees: (payout.amount / 100).toFixed(2),
          action: data.action,
          transactionReference: data.transactionReference,
          adminNotes: data.adminNotes,
        },
      });
    } catch (auditErr) {
      console.error("[Payout] Failed to record audit log:", auditErr);
    }

    return result;
  },
};