import { db } from "../../config/db.js";
import { notificationService } from "../notification/notification.service.js";
import { AppError } from "../../core/errors/AppError.js";
import {
  findReviewerWalletRepo,
  createReviewerWalletRepo,
  findReviewerPayoutProfileRepo,
  findWalletTransactionsByReviewerRepo,
  findPayoutRequestsByReviewerRepo,
  updatePayoutProfileRepo,
  createPayoutProfileRepo,
  updateWalletBalancesForPayoutRepo,
  createPayoutRequestRepo,
  createWalletTransactionRepo,
  findMaturedEscrowTransactionsRepo,
  clearEscrowTransactionRepo,
} from "./wallet.repository.js";

export const walletService = {
  getWalletOverview: async (reviewerId: number) => {
    // Mature any eligible 48h escrow transactions first
    await walletService.matureEscrowTransactions().catch((err) => {
      console.error("[WalletService] Error maturing escrow transactions:", err);
    });

    let wallet = await findReviewerWalletRepo(reviewerId);

    if (!wallet) {
      wallet = await createReviewerWalletRepo(reviewerId);
    }

    const payoutProfile = await findReviewerPayoutProfileRepo(reviewerId);
    const transactions = await findWalletTransactionsByReviewerRepo(reviewerId, 30);
    const payouts = await findPayoutRequestsByReviewerRepo(reviewerId, 10);

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
      accountHolderName?: string | undefined;
      accountNumber?: string | undefined;
      ifscCode?: string | undefined;
      upiId?: string | undefined;
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

    const existing = await findReviewerPayoutProfileRepo(reviewerId);

    if (existing) {
      const updated = await updatePayoutProfileRepo(existing.id, data);
      return updated;
    }

    const created = await createPayoutProfileRepo(reviewerId, data);
    return created;
  },

  requestPayout: async (reviewerId: number, amountPaise: number) => {
    if (amountPaise < 10000) {
      throw new AppError("Minimum payout amount is ₹100", 400);
    }

    const profile = await findReviewerPayoutProfileRepo(reviewerId);

    if (!profile) {
      throw new AppError("Please add your payout details (Bank or UPI) before requesting a payout", 400);
    }

    const result = await db.transaction(async (tx) => {
      const wallet = await findReviewerWalletRepo(reviewerId, tx);

      if (!wallet || wallet.availableBalance < amountPaise) {
        throw new AppError("Insufficient available balance for this payout", 400);
      }

      // Decrement available balance, increment withdrawn balance
      await updateWalletBalancesForPayoutRepo(
        wallet.id,
        amountPaise,
        wallet.availableBalance,
        wallet.withdrawnBalance,
        tx
      );

      const payout = await createPayoutRequestRepo(reviewerId, amountPaise, tx);

      await createWalletTransactionRepo(
        {
          reviewerId,
          type: "withdrawal",
          amount: amountPaise,
          status: "pending",
          description: `Payout requested: ₹${(amountPaise / 100).toFixed(2)} to ${profile.payoutMethod === "upi" ? profile.upiId : profile.accountNumber}`,
        },
        tx
      );

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
    const matured = await findMaturedEscrowTransactionsRepo();

    for (const tx of matured) {
      await db.transaction(async (dbTx) => {
        const wallet = await findReviewerWalletRepo(tx.reviewerId, dbTx);

        if (wallet && wallet.pendingBalance >= tx.amount) {
          await clearEscrowTransactionRepo(
            wallet.id,
            tx.amount,
            wallet.pendingBalance,
            wallet.availableBalance,
            tx.id,
            dbTx
          );
        }
      });
    }
  },
};
