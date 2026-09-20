import dayjs from "dayjs";
import { eq, sql } from "drizzle-orm";
import { db } from "../../config/db.js";
import { payments } from "./payments.schema.js";
import { bookings } from "../booking/bookings.schema.js";
import { reviewerWallets, walletTransactions } from "../wallet/wallet.schema.js";
import { razorpay } from "../../config/razorpay.js";
import { AppError } from "../../core/errors/AppError.js";

export const CANCELLATION_FEE_PERCENT = 15; // 15% cancellation fee when client cancels between 3 and 8 hours

export interface ProcessRefundParams {
  bookingId: number;
  initiatedBy: "reviewer" | "advisor" | "reschedule_decline" | "system";
  reason?: string;
}

export const refundService = {
  processBookingRefund: async (params: ProcessRefundParams) => {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.bookingId, params.bookingId))
      .limit(1);

    // If no payment record exists or payment was not captured (e.g. free session), nothing to refund
    if (!payment || payment.status !== "captured" || !payment.razorpayPaymentId) {
      return null;
    }

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, params.bookingId))
      .limit(1);

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
      await tx
        .update(payments)
        .set({
          status: cancellationFee > 0 ? "partially_refunded" : "refunded",
          refundId,
          refundAmount,
          cancellationFee,
          refundReason: params.reason || `Cancelled by ${params.initiatedBy}`,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      // Reviewer wallet updates
      const [wallet] = await tx
        .select()
        .from(reviewerWallets)
        .where(eq(reviewerWallets.reviewerId, payment.reviewerId))
        .limit(1);

      if (wallet) {
        // Decrement old session escrow, but retain cancellation compensation in pending balance for 24h clearance
        const newPending = Math.max(0, wallet.pendingBalance - payment.amount) + cancellationFee;
        const newAvailable = wallet.availableBalance; // Unchanged until cleared

        await tx
          .update(reviewerWallets)
          .set({
            pendingBalance: newPending,
            availableBalance: newAvailable,
            updatedAt: new Date(),
          })
          .where(eq(reviewerWallets.id, wallet.id));

        // Record refund transaction if client was refunded
        if (refundAmount > 0) {
          await tx.insert(walletTransactions).values({
            reviewerId: payment.reviewerId,
            bookingId: params.bookingId,
            type: "escrow_cancelled",
            amount: refundAmount,
            status: "completed",
            description: `Refund processed: ₹${(refundAmount / 100).toFixed(2)} refunded to client (${params.initiatedBy} cancellation)`,
          });
        }

        if (cancellationFee > 0) {
          await tx.insert(walletTransactions).values({
            reviewerId: payment.reviewerId,
            bookingId: params.bookingId,
            type: "cancellation_compensation",
            amount: cancellationFee,
            status: "completed",
            availableAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24-hour security hold
            description: booking.rescheduleCount > 0
              ? `Cancellation compensation (24h clearance): ₹${(cancellationFee / 100).toFixed(2)} full compensation from cancelled rescheduled session`
              : `Cancellation fee credited (24h clearance): ₹${(cancellationFee / 100).toFixed(2)} compensation from late cancellation`,
          });
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
