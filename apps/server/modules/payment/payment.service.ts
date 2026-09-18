import { eq, and, sql } from "drizzle-orm";
import { db } from "../../config/db.js";
import { slots } from "../slot/slots.schema.js";
import { eventTypes } from "../eventType/eventTypes.schema.js";
import { razorpay } from "../../config/razorpay.js";
import { AppError } from "../../core/errors/AppError.js";

export const paymentService = {
  // Called right before opening Razorpay Checkout on the booking page.
  // Needs the still-active hold to know which event type (and price)
  // this order is for — reuses the same hold lookup as createBooking.
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

    const order = await razorpay.orders.create({
      amount: eventType.price * 100, // rupees -> paise
      currency: "INR",
      receipt: holdToken,
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID as string,
    };
  },
};