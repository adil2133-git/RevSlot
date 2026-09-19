import dayjs from "dayjs";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../../config/db.js";
import { slots } from "../slot/slots.schema.js";
import { eventTypes } from "../eventType/eventTypes.schema.js";
import { payments } from "./payments.schema.js";
import { razorpay } from "../../config/razorpay.js";
import { AppError } from "../../core/errors/AppError.js";

export const paymentService = {
  // Called right before opening Razorpay Checkout on the booking page.
  // Extends the hold by 10 minutes to eliminate checkout timeouts (zombie payments)
  // and records the pending order in the payments table.
  createOrder: async (holdToken: string) => {
    const [slot] = await db
      .select()
      .from(slots)
      .where(
        and(
          eq(slots.holdToken, holdToken),
          eq(slots.status, "held"),
          sql`${slots.holdExpiresAt} > now()`
        )
      )
      .limit(1);

    if (!slot) {
      throw new AppError("Hold expired or invalid — please select the slot again", 410);
    }

    const [eventType] = await db
      .select({ price: eventTypes.price })
      .from(eventTypes)
      .where(eq(eventTypes.id, slot.eventTypeId))
      .limit(1);

    if (!eventType || eventType.price <= 0) {
      throw new AppError("This session is free — no payment needed", 400);
    }

    // Extend hold by 10 minutes so user has ample time to complete UPI/OTP
    const extendedHoldExpiresAt = dayjs().add(10, "minute").toDate();
    await db
      .update(slots)
      .set({ holdExpiresAt: extendedHoldExpiresAt, updatedAt: new Date() })
      .where(eq(slots.id, slot.id));

    const order = await razorpay.orders.create({
      amount: eventType.price * 100, // rupees -> paise
      currency: "INR",
      receipt: holdToken,
    });

    // Record order in payments table
    await db.insert(payments).values({
      holdToken,
      reviewerId: slot.reviewerId,
      amount: Number(order.amount),
      currency: order.currency,
      razorpayOrderId: order.id,
      status: "created",
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID as string,
    };
  },
};