import dayjs from "dayjs";
import { db } from "../../config/db.js";
import { razorpay } from "../../config/razorpay.js";
import { AppError } from "../../core/errors/AppError.js";
import {
  findPaymentByBookingIdRepo,
  findBookingForRefundRepo,
  updatePaymentRefundRepo,
  findReviewerWalletForRefundRepo,
  updateWalletForRefundRepo,
  insertRefundWalletTransactionsRepo,
} from "./payment.repository.js";

export const CANCELLATION_FEE_PERCENT = 15; // 15% cancellation fee when client cancels between 3 and 8 hours

export interface ProcessRefundParams {
  bookingId: number;
  initiatedBy: "reviewer" | "advisor" | "reschedule_decline" | "system";
  reason?: string;
}

export const refundService = {
  processBookingRefund: async (params: ProcessRefundParams) => {
    const payment = await findPaymentByBookingIdRepo(params.bookingId);

    // If no payment record exists or payment was not captured (e.g. free session), nothing to refund
    if (!payment || payment.status !== "captured" || !payment.razorpayPaymentId) {
      return null;
    }

    const booking = await findBookingForRefundRepo(params.bookingId);

    if (!booking) {
      throw new AppError("Booking not found for refund", 404);
    }

    let refundAmount = payment.amount;
    let cancellationFee = 0;

    // Reviewer cancel or reschedule decline: always 100% full refund
    if (params.initiatedBy === "reviewer" || params.initiatedBy === "reschedule_decline" || params.initiatedBy === "system") {
      refundAmount = payment.amount;
      cancellationFee = 0;
    } else if (params.initiatedBy === "advisor") {
      // Advisor / client cancellation logic
      const hoursUntilStart = dayjs(booking.startTime).diff(dayjs(), "hour", true);

      if (hoursUntilStart < 3) {
        // Less than 3 hours: Non-cancellable online
        throw new AppError("Sessions starting in less than 3 hours cannot be cancelled online", 409);
      }

      // If the booking was already rescheduled by the client, it is strictly NON-REFUNDABLE
      if (booking.rescheduleCount > 0) {
        cancellationFee = payment.amount; // 100% retained and transferred to reviewer
        refundAmount = 0; // 0% refunded to client
      } else if (hoursUntilStart >= 8) {
        // More than 8 hours: 100% full refund
        refundAmount = payment.amount;
        cancellationFee = 0;
      } else {
        // Between 3 and 8 hours: Partial refund with cancellation fee
        cancellationFee = Math.round((payment.amount * CANCELLATION_FEE_PERCENT) / 100);
        refundAmount = payment.amount - cancellationFee;
      }
    }

    let refundId: string | null = null;

    if (refundAmount > 0) {
      try {
        const rzpRefund = await razorpay.payments.refund(payment.razorpayPaymentId, {
          amount: refundAmount, // in paise
          notes: {
            bookingId: String(params.bookingId),
            initiatedBy: params.initiatedBy,
            reason: params.reason || `Cancelled by ${params.initiatedBy}`,
          },
        });
        refundId = rzpRefund.id;
      } catch (err: any) {
        console.error(`[RefundService] Razorpay refund failed for payment ${payment.id}:`, err);
        throw new AppError(`Razorpay refund failed: ${err.message || "Unknown error"}`, 500);
      }
    }

    // Update database in transaction
    await db.transaction(async (tx) => {
      await updatePaymentRefundRepo(
        payment.id,
        {
          status: cancellationFee > 0 ? "partially_refunded" : "refunded",
          refundId,
          refundAmount,
          cancellationFee,
          refundReason: params.reason || `Cancelled by ${params.initiatedBy}`,
        },
        tx
      );

      // Reviewer wallet updates
      const wallet = await findReviewerWalletForRefundRepo(payment.reviewerId, tx);

      if (wallet) {
        // Decrement old session escrow, but retain cancellation compensation in pending balance for 24h clearance
        const newPending = Math.max(0, wallet.pendingBalance - payment.amount) + cancellationFee;
        const newAvailable = wallet.availableBalance; // Unchanged until cleared

        await updateWalletForRefundRepo(wallet.id, newPending, newAvailable, tx);

        const newTxList = [];

        // Record refund transaction if client was refunded
        if (refundAmount > 0) {
          newTxList.push({
            reviewerId: payment.reviewerId,
            bookingId: params.bookingId,
            type: "escrow_cancelled" as const,
            amount: refundAmount,
            status: "completed" as const,
            description: `Refund processed: ₹${(refundAmount / 100).toFixed(2)} refunded to client (${params.initiatedBy} cancellation)`,
          });
        }

        if (cancellationFee > 0) {
          newTxList.push({
            reviewerId: payment.reviewerId,
            bookingId: params.bookingId,
            type: "cancellation_compensation" as const,
            amount: cancellationFee,
            status: "completed" as const,
            availableAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24-hour security hold
            description: booking.rescheduleCount > 0
              ? `Cancellation compensation (24h clearance): ₹${(cancellationFee / 100).toFixed(2)} full compensation from cancelled rescheduled session`
              : `Cancellation fee credited (24h clearance): ₹${(cancellationFee / 100).toFixed(2)} compensation from late cancellation`,
          });
        }

        if (newTxList.length > 0) {
          await insertRefundWalletTransactionsRepo(newTxList, tx);
        }
      }
    });

    return {
      refundId,
      refundAmount,
      cancellationFee,
      status: cancellationFee > 0 ? "partially_refunded" : "refunded",
    };
  },
};
