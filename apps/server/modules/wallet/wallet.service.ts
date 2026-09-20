import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { db } from "../../config/db.js";
import { reviewerWallets, walletTransactions, reviewerPayoutProfiles, payoutRequests } from "./wallet.schema.js";
import { notificationService } from "../notification/notification.service.js";
import { AppError } from "../../core/errors/AppError.js";

export const walletService = {
  getWalletOverview: async (reviewerId: number) => {
    // Mature any eligible 48h escrow transactions first
    await walletService.matureEscrowTransactions().catch((err) => {
      console.error("[WalletService] Error maturing escrow transactions:", err);
    });

    let [wallet] = await db
      .select()
      .from(reviewerWallets)
      .where(eq(reviewerWallets.reviewerId, reviewerId))
      .limit(1);

    if (!wallet) {
      const [newWallet] = await db
        .insert(reviewerWallets)
        .values({
          reviewerId,
          pendingBalance: 0,
          availableBalance: 0,
          withdrawnBalance: 0,
        })
        .returning();
      wallet = newWallet;
    }

    const [payoutProfile] = await db
      .select()
      .from(reviewerPayoutProfiles)
      .where(eq(reviewerPayoutProfiles.reviewerId, reviewerId))
      .limit(1);

    const transactions = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.reviewerId, reviewerId))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(30);

    const payouts = await db
      .select()
      .from(payoutRequests)
      .where(eq(payoutRequests.reviewerId, reviewerId))
      .orderBy(desc(payoutRequests.requestedAt))
      .limit(10);

    const pendingBalance = wallet?.pendingBalance ?? 0;
    const availableBalance = wallet?.availableBalance ?? 0;
    const withdrawnBalance = wallet?.withdrawnBalance ?? 0;

    return {
      wallet: {
        pendingBalance,
        availableBalance,
        withdrawnBalance,
        totalEarnings: availableBalance + pendingBalance + withdrawnBalance,
      },
      payoutProfile: payoutProfile || null,
      transactions,
      payoutRequests: payouts,
    };
  },

  savePayoutProfile: async (
    reviewerId: number,
    data: {
      payoutMethod: "bank_account" | "upi";
      accountHolderName?: string;
      accountNumber?: string;
      ifscCode?: string;
      upiId?: string;
    }
  ) => {
    if (data.payoutMethod === "bank_account") {
      if (!data.accountHolderName || !data.accountNumber || !data.ifscCode) {
        throw new AppError("Account holder name, account number, and IFSC code are required for bank transfer", 400);
      }
    } else if (data.payoutMethod === "upi") {
      if (!data.upiId || !data.upiId.includes("@")) {
        throw new AppError("A valid UPI ID is required", 400);
      }
    }

    const [existing] = await db
      .select()
      .from(reviewerPayoutProfiles)
      .where(eq(reviewerPayoutProfiles.reviewerId, reviewerId))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(reviewerPayoutProfiles)
        .set({
          payoutMethod: data.payoutMethod,
          accountHolderName: data.accountHolderName,
          accountNumber: data.accountNumber,
          ifscCode: data.ifscCode,
          upiId: data.upiId,
          updatedAt: new Date(),
        })
        .where(eq(reviewerPayoutProfiles.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(reviewerPayoutProfiles)
      .values({
        reviewerId,
        payoutMethod: data.payoutMethod,
        accountHolderName: data.accountHolderName,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        upiId: data.upiId,
      })
      .returning();

    return created;
  },

  requestPayout: async (reviewerId: number, amountPaise: number) => {
    if (amountPaise < 10000) {
      throw new AppError("Minimum payout amount is ₹100", 400);
    }

    const [profile] = await db
      .select()
      .from(reviewerPayoutProfiles)
      .where(eq(reviewerPayoutProfiles.reviewerId, reviewerId))
      .limit(1);

    if (!profile) {
      throw new AppError("Please add your payout details (Bank or UPI) before requesting a payout", 400);
    }

    const result = await db.transaction(async (tx) => {
      const [wallet] = await tx
        .select()
        .from(reviewerWallets)
        .where(eq(reviewerWallets.reviewerId, reviewerId))
        .limit(1);

      if (!wallet || wallet.availableBalance < amountPaise) {
        throw new AppError("Insufficient available balance for this payout", 400);
      }

      // Decrement available balance, increment withdrawn balance
      await tx
        .update(reviewerWallets)
        .set({
          availableBalance: wallet.availableBalance - amountPaise,
          withdrawnBalance: wallet.withdrawnBalance + amountPaise,
          updatedAt: new Date(),
        })
        .where(eq(reviewerWallets.id, wallet.id));

      const [payout] = await tx
        .insert(payoutRequests)
        .values({
          reviewerId,
          amount: amountPaise,
          status: "requested",
        })
        .returning();

      await tx.insert(walletTransactions).values({
        reviewerId,
        type: "withdrawal",
        amount: amountPaise,
        status: "pending",
        description: `Payout requested: ₹${(amountPaise / 100).toFixed(2)} to ${profile.payoutMethod === "upi" ? profile.upiId : profile.accountNumber}`,
      });

      return payout;
    });

    // 1. Notify reviewer (live socket)
    notificationService.createNotification({
      reviewerId,
      type: "payout_processed",
      title: "Payout requested",
      message: `Your withdrawal request for ₹${(amountPaise / 100).toFixed(2)} has been submitted for admin processing.`,
    }).catch((err) => console.error("[Wallet] Reviewer payout notification error:", err));

    // 2. Notify admins (live socket)
    notificationService.createAdminNotification({
      type: "admin_new_payout",
      title: "New payout request",
      message: `A reviewer requested a payout of ₹${(amountPaise / 100).toFixed(2)}.`,
    }).catch((err) => console.error("[Wallet] Admin payout notification error:", err));

    return result;
  },

  // Releases matured escrow funds to available balance 48 hours after session end
  matureEscrowTransactions: async () => {
    const matured = await db
      .select()
      .from(walletTransactions)
      .where(
        and(
          inArray(walletTransactions.type, ["credit_escrow", "cancellation_compensation"]),
          eq(walletTransactions.status, "completed"),
          sql`${walletTransactions.availableAt} <= now()`
        )
      );

    for (const tx of matured) {
      await db.transaction(async (dbTx) => {
        const [wallet] = await dbTx
          .select()
          .from(reviewerWallets)
          .where(eq(reviewerWallets.reviewerId, tx.reviewerId))
          .limit(1);

        if (wallet && wallet.pendingBalance >= tx.amount) {
          await dbTx
            .update(reviewerWallets)
            .set({
              pendingBalance: wallet.pendingBalance - tx.amount,
              availableBalance: wallet.availableBalance + tx.amount,
              updatedAt: new Date(),
            })
            .where(eq(reviewerWallets.id, wallet.id));

          // Mark this transaction as cleared
          await dbTx
            .update(walletTransactions)
            .set({ type: "escrow_cleared" })
            .where(eq(walletTransactions.id, tx.id));
        }
      });
    }
  },
};
