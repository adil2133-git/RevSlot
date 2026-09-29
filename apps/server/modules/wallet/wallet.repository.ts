import { eq, and, sql, desc, inArray, type InferInsertModel } from "drizzle-orm";
import { db } from "../../config/db.js";
import { reviewerWallets, walletTransactions, reviewerPayoutProfiles, payoutRequests } from "./wallet.schema.js";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | Transaction;

export type NewReviewerWallet = InferInsertModel<typeof reviewerWallets>;
export type NewWalletTransaction = InferInsertModel<typeof walletTransactions>;
export type NewPayoutProfile = InferInsertModel<typeof reviewerPayoutProfiles>;
export type NewPayoutRequest = InferInsertModel<typeof payoutRequests>;

export interface SavePayoutProfileData {
  payoutMethod: "bank_account" | "upi";
  accountHolderName?: string | undefined;
  accountNumber?: string | undefined;
  ifscCode?: string | undefined;
  upiId?: string | undefined;
}

export const findReviewerWalletRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [wallet] = await tx
    .select()
    .from(reviewerWallets)
    .where(eq(reviewerWallets.reviewerId, reviewerId))
    .limit(1);

  return wallet;
};

export const createReviewerWalletRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [newWallet] = await tx
    .insert(reviewerWallets)
    .values({
      reviewerId,
      pendingBalance: 0,
      availableBalance: 0,
      withdrawnBalance: 0,
    })
    .returning();

  return newWallet;
};

export const findReviewerPayoutProfileRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [payoutProfile] = await tx
    .select()
    .from(reviewerPayoutProfiles)
    .where(eq(reviewerPayoutProfiles.reviewerId, reviewerId))
    .limit(1);

  return payoutProfile;
};

export const findWalletTransactionsByReviewerRepo = async (
  reviewerId: number,
  limit = 30,
  tx: DbOrTx = db
) => {
  return await tx
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.reviewerId, reviewerId))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(limit);
};

export const findPayoutRequestsByReviewerRepo = async (
  reviewerId: number,
  limit = 10,
  tx: DbOrTx = db
) => {
  return await tx
    .select()
    .from(payoutRequests)
    .where(eq(payoutRequests.reviewerId, reviewerId))
    .orderBy(desc(payoutRequests.requestedAt))
    .limit(limit);
};

export const updatePayoutProfileRepo = async (
  profileId: number,
  data: SavePayoutProfileData,
  tx: DbOrTx = db
) => {
  const [updated] = await tx
    .update(reviewerPayoutProfiles)
    .set({
      payoutMethod: data.payoutMethod,
      accountHolderName: data.accountHolderName,
      accountNumber: data.accountNumber,
      ifscCode: data.ifscCode,
      upiId: data.upiId,
      updatedAt: new Date(),
    })
    .where(eq(reviewerPayoutProfiles.id, profileId))
    .returning();

  return updated;
};

export const createPayoutProfileRepo = async (
  reviewerId: number,
  data: SavePayoutProfileData,
  tx: DbOrTx = db
) => {
  const [created] = await tx
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
};

export const updateWalletBalancesForPayoutRepo = async (
  walletId: number,
  amountPaise: number,
  currentAvailable: number,
  currentWithdrawn: number,
  tx: DbOrTx = db
) => {
  return await tx
    .update(reviewerWallets)
    .set({
      availableBalance: currentAvailable - amountPaise,
      withdrawnBalance: currentWithdrawn + amountPaise,
      updatedAt: new Date(),
    })
    .where(eq(reviewerWallets.id, walletId));
};

export const createPayoutRequestRepo = async (
  reviewerId: number,
  amountPaise: number,
  tx: DbOrTx = db
) => {
  const [payout] = await tx
    .insert(payoutRequests)
    .values({
      reviewerId,
      amount: amountPaise,
      status: "requested",
    })
    .returning();

  return payout;
};

export const createWalletTransactionRepo = async (
  data: NewWalletTransaction,
  tx: DbOrTx = db
) => {
  return await tx.insert(walletTransactions).values(data);
};

export const findMaturedEscrowTransactionsRepo = async (
  tx: DbOrTx = db
) => {
  return await tx
    .select()
    .from(walletTransactions)
    .where(
      and(
        inArray(walletTransactions.type, ["credit_escrow", "cancellation_compensation"]),
        eq(walletTransactions.status, "completed"),
        sql`${walletTransactions.availableAt} <= now()`
      )
    );
};

export const clearEscrowTransactionRepo = async (
  walletId: number,
  txAmount: number,
  currentPending: number,
  currentAvailable: number,
  transactionId: number,
  tx: DbOrTx = db
) => {
  await tx
    .update(reviewerWallets)
    .set({
      pendingBalance: currentPending - txAmount,
      availableBalance: currentAvailable + txAmount,
      updatedAt: new Date(),
    })
    .where(eq(reviewerWallets.id, walletId));

  // Mark this transaction as cleared
  await tx
    .update(walletTransactions)
    .set({ type: "escrow_cleared" })
    .where(eq(walletTransactions.id, transactionId));
};

export const walletRepository = {
  findReviewerWallet: findReviewerWalletRepo,
  createReviewerWallet: createReviewerWalletRepo,
  findReviewerPayoutProfile: findReviewerPayoutProfileRepo,
  findWalletTransactionsByReviewer: findWalletTransactionsByReviewerRepo,
  findPayoutRequestsByReviewer: findPayoutRequestsByReviewerRepo,
  updatePayoutProfile: updatePayoutProfileRepo,
  createPayoutProfile: createPayoutProfileRepo,
  updateWalletBalancesForPayout: updateWalletBalancesForPayoutRepo,
  createPayoutRequest: createPayoutRequestRepo,
  createWalletTransaction: createWalletTransactionRepo,
  findMaturedEscrowTransactions: findMaturedEscrowTransactionsRepo,
  clearEscrowTransaction: clearEscrowTransactionRepo,
};
