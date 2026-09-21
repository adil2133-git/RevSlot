import type { Request, Response } from "express";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../../config/db.js";
import { payments } from "./payments.schema.js";
import { bookings } from "../booking/bookings.schema.js";
import { slots } from "../slot/slots.schema.js";
import { eventTypes } from "../eventType/eventTypes.schema.js";
import { availabilityTemplates } from "../availability/schema/availabilityTemplates.schema.js";
import { reviewerWallets, walletTransactions } from "../wallet/wallet.schema.js";
import { bookingService } from "../booking/booking.service.js";
import dayjs from "../../config/dayjs.js";

export const webhookController = {
  handleRazorpayWebhook: async (req: Request, res: Response) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"] as string;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      const rawBody = (req as any).rawBody ? (req as any).rawBody.toString() : JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== signature) {
        console.warn("[Razorpay Webhook] Invalid webhook signature received.");
        res.status(400).json({ status: "error", message: "Invalid signature" });
        return;
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`[Razorpay Webhook] Processing event: ${event}`);

    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload?.payment?.entity;
      const orderId = paymentEntity?.order_id || payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        const [paymentRecord] = await db
          .select()
          .from(payments)
          .where(eq(payments.razorpayOrderId, orderId))
          .limit(1);

        if (paymentRecord && paymentRecord.status !== "captured") {
          // If browser tab didn't call /verify, update payment status here
          await db
            .update(payments)
            .set({
              status: "captured",
              razorpayPaymentId: paymentId || paymentRecord.razorpayPaymentId,
              updatedAt: new Date(),
            })
            .where(eq(payments.id, paymentRecord.id));

          // If booking was not yet finalized (tab closed early), attempt auto-recovery
          if (!paymentRecord.bookingId && paymentRecord.holdToken) {
            console.log(`[Razorpay Webhook] Recovering booking for holdToken ${paymentRecord.holdToken}`);
            const [heldSlot] = await db
              .select()
              .from(slots)
              .where(eq(slots.holdToken, paymentRecord.holdToken))
              .limit(1);

            if (heldSlot && heldSlot.status === "held") {
              // If the hold is still active, user is actively completing checkout in their browser.
              // Defer auto-recovery to let the browser submit the real user form details.
              const isHoldExpired = dayjs().isAfter(heldSlot.holdExpiresAt);
              if (!isHoldExpired) {
                console.log(`[Razorpay Webhook] Slot hold is still active for ${paymentRecord.holdToken}. Deferring auto-recovery to browser verification.`);
                return;
              }

              const [templateRow] = await db
                .select({ timezone: availabilityTemplates.timezone })
                .from(eventTypes)
                .innerJoin(
                  availabilityTemplates,
                  eq(eventTypes.availabilityTemplateId, availabilityTemplates.id)
                )
                .where(eq(eventTypes.id, heldSlot.eventTypeId))
                .limit(1);

              const timezone = templateRow?.timezone || "Asia/Kolkata";
              const startTimestamp = dayjs.tz(`${heldSlot.slotDate} ${heldSlot.startTime}`, timezone).toDate();
              const endTimestamp = dayjs.tz(`${heldSlot.slotDate} ${heldSlot.endTime}`, timezone).toDate();

              const recoveredBooking = await db.transaction(async (tx) => {
                const [newBooking] = await tx
                  .insert(bookings)
                  .values({
                    eventTypeId: heldSlot.eventTypeId,
                    reviewerId: heldSlot.reviewerId,
                    internName: "Booking via Online Payment",
                    batch: "Online",
                    advisorName: "Online Client",
                    advisorEmail: paymentEntity?.email || paymentRecord.advisorEmail || "client@revslot.com",
                    weekStage: "General",
                    formData: {},
                    startTime: startTimestamp,
                    endTime: endTimestamp,
                    status: "confirmed",
                    razorpayOrderId: orderId,
                    razorpayPaymentId: paymentId,
                  })
                  .returning();

                await tx
                  .update(slots)
                  .set({ status: "booked", updatedAt: new Date() })
                  .where(eq(slots.id, heldSlot.id));

                if (newBooking) {
                  await tx
                    .update(payments)
                    .set({ bookingId: newBooking.id })
                    .where(eq(payments.id, paymentRecord.id));
                }

                return newBooking;
              });

              if (recoveredBooking) {
                // Initialize reviewer wallet pending balance
                const [wallet] = await db
                  .select()
                  .from(reviewerWallets)
                  .where(eq(reviewerWallets.reviewerId, heldSlot.reviewerId))
                  .limit(1);

                if (wallet) {
                  await db
                    .update(reviewerWallets)
                    .set({
                      pendingBalance: wallet.pendingBalance + paymentRecord.amount,
                      updatedAt: new Date(),
                    })
                    .where(eq(reviewerWallets.id, wallet.id));
                } else {
                  await db.insert(reviewerWallets).values({
                    reviewerId: heldSlot.reviewerId,
                    pendingBalance: paymentRecord.amount,
                    availableBalance: 0,
                    withdrawnBalance: 0,
                  });
                }

                await bookingService.finalizeBooking(recoveredBooking).catch((err) => {
                  console.error("[Razorpay Webhook] Failed to finalize recovered booking:", err);
                });
              }
            }
          }
        }
      }
    } else if (event === "refund.processed") {
      const refundEntity = payload?.refund?.entity;
      const paymentId = refundEntity?.payment_id;

      if (paymentId) {
        await db
          .update(payments)
          .set({
            status: "refunded",
            refundId: refundEntity.id,
            refundAmount: refundEntity.amount,
            updatedAt: new Date(),
          })
          .where(eq(payments.razorpayPaymentId, paymentId));
      }
    }

    res.status(200).json({ status: "ok" });
  },
};
