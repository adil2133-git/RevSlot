import { eq, desc, sql } from "drizzle-orm";
import { db } from "../../config/db.js";
import { payoutRequests, reviewerWallets, walletTransactions, reviewerPayoutProfiles } from "../wallet/wallet.schema.js";
import { reviewers } from "../auth/reviewers.schema.js";
import { admins } from "./admins.schema.js";
import { auditLogService } from "../auditLog/auditLog.service.js";
import { emailService } from "../../services/email.service.js";
import { payoutProcessedTemplate, payoutProcessedTemplateData } from "../../emails/templates/payoutProcessed.js";
import { notificationService } from "../notification/notification.service.js";
import { AppError } from "../../core/errors/AppError.js";

export const adminPayoutsService = {
  listPayoutRequests: async (params: {
    status?: "requested" | "completed" | "rejected";
    page?: number;
    limit?: number;
  }) => {
    const page = params.page || 1;
    const limit = params.limit || 5;
    const offset = (page - 1) * limit;

    const baseQuery = db
      .select({
        id: payoutRequests.id,
        reviewerId: payoutRequests.reviewerId,
        amount: payoutRequests.amount,
        status: payoutRequests.status,
        transactionReference: payoutRequests.transactionReference,
        notes: payoutRequests.notes,
        adminNotes: payoutRequests.adminNotes,
        requestedAt: payoutRequests.requestedAt,
        processedAt: payoutRequests.processedAt,
        processedBy: payoutRequests.processedBy,
        // Reviewer
        reviewerName: reviewers.name,
        reviewerEmail: reviewers.email,
        reviewerAvatar: reviewers.avatarUrl,
        reviewerDepartment: reviewers.professionalHeadline,
        // Payout Profile details
        payoutMethod: reviewerPayoutProfiles.payoutMethod,
        accountHolderName: reviewerPayoutProfiles.accountHolderName,
        accountNumber: reviewerPayoutProfiles.accountNumber,
        ifscCode: reviewerPayoutProfiles.ifscCode,
        upiId: reviewerPayoutProfiles.upiId,
      })
      .from(payoutRequests)
      .innerJoin(reviewers, eq(reviewers.id, payoutRequests.reviewerId))
      .leftJoin(
        reviewerPayoutProfiles,
        eq(reviewerPayoutProfiles.reviewerId, payoutRequests.reviewerId)
      );

    const whereClause = params.status
      ? eq(payoutRequests.status, params.status)
      : undefined;

    const items = await (whereClause ? baseQuery.where(whereClause) : baseQuery)
      .orderBy(desc(payoutRequests.requestedAt))
      .limit(limit)
      .offset(offset);

    const [totalRecord] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(payoutRequests)
      .where(whereClause ? whereClause : sql`true`);

    // Calculate quick stats
    const [stats] = await db
      .select({
        pendingCount: sql<number>`count(case when ${payoutRequests.status} = 'requested' then 1 end)::int`,
        pendingAmount: sql<number>`coalesce(sum(case when ${payoutRequests.status} = 'requested' then ${payoutRequests.amount} else 0 end), 0)::int`,
        completedAmount: sql<number>`coalesce(sum(case when ${payoutRequests.status} = 'completed' then ${payoutRequests.amount} else 0 end), 0)::int`,
      })
      .from(payoutRequests);

    return {
      items,
      total: totalRecord?.count || 0,
      page,
      limit,
      stats: {
        pendingCount: stats?.pendingCount || 0,
        pendingAmount: stats?.pendingAmount || 0,
        completedAmount: stats?.completedAmount || 0,
      },
    };
  },

  processPayout: async (
    payoutId: number,
    adminId: number,
    data: {
      action: "approve" | "reject";
      transactionReference?: string;
      adminNotes?: string;
    }
  ) => {
    const [payout] = await db
      .select()
      .from(payoutRequests)
      .where(eq(payoutRequests.id, payoutId))
      .limit(1);

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

        const [updated] = await tx
          .update(payoutRequests)
          .set({
            status: "completed",
            transactionReference: data.transactionReference.trim(),
            adminNotes: data.adminNotes || "Approved and transferred",
            processedAt: new Date(),
            processedBy: adminId,
          })
          .where(eq(payoutRequests.id, payoutId))
          .returning();

        // Update corresponding pending wallet transaction
        const [recentTx] = await tx
          .select()
          .from(walletTransactions)
          .where(
            eq(walletTransactions.reviewerId, payout.reviewerId)
          )
          .orderBy(desc(walletTransactions.createdAt))
          .limit(5);

        if (recentTx && recentTx.type === "withdrawal") {
          await tx
            .update(walletTransactions)
            .set({
              status: "completed",
              description: `${recentTx.description} (Ref: ${data.transactionReference.trim()})`,
            })
            .where(eq(walletTransactions.id, recentTx.id));
        }

        return updated;
      } else {
        // Reject: refund funds back to reviewer's availableBalance
        const [wallet] = await tx
          .select()
          .from(reviewerWallets)
          .where(eq(reviewerWallets.reviewerId, payout.reviewerId))
          .limit(1);

        if (wallet) {
          await tx
            .update(reviewerWallets)
            .set({
              availableBalance: wallet.availableBalance + payout.amount,
              withdrawnBalance: Math.max(0, wallet.withdrawnBalance - payout.amount),
              updatedAt: new Date(),
            })
            .where(eq(reviewerWallets.id, wallet.id));
        }

        const [updated] = await tx
          .update(payoutRequests)
          .set({
            status: "rejected",
            adminNotes: data.adminNotes || "Rejected by administrator",
            processedAt: new Date(),
            processedBy: adminId,
          })
          .where(eq(payoutRequests.id, payoutId))
          .returning();

        // Add compensation refund ledger entry
        await tx.insert(walletTransactions).values({
          reviewerId: payout.reviewerId,
          type: "withdrawal",
          amount: payout.amount,
          status: "failed",
          description: `Payout rejected (Funds restored): ₹${(payout.amount / 100).toFixed(2)} refunded to available balance. Reason: ${data.adminNotes || "Admin rejection"}`,
        });

        return updated;
      }
    });

    // Send in-app notification & email to reviewer
    const [reviewer] = await db
      .select({ name: reviewers.name, email: reviewers.email })
      .from(reviewers)
      .where(eq(reviewers.id, payout.reviewerId))
      .limit(1);

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
      const [actorAdmin] = await db.select({ name: admins.name }).from(admins).where(eq(admins.id, adminId));
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