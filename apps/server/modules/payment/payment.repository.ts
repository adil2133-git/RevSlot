import { eq, and, sql, type InferInsertModel } from "drizzle-orm";
import { db } from "../../config/db.js";
import { payments } from "./payments.schema.js";
import { slots } from "../slot/slots.schema.js";
import { eventTypes } from "../eventType/eventTypes.schema.js";
import { bookings } from "../booking/bookings.schema.js";
import { reviewerWallets, walletTransactions } from "../wallet/wallet.schema.js";
import { availabilityTemplates } from "../availability/schema/availabilityTemplates.schema.js";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | Transaction;

export type NewPayment = InferInsertModel<typeof payments>;

export const findHeldSlotByTokenWithActiveExpiryRepo = async (
  holdToken: string,
  tx: DbOrTx = db
) => {
  const [slot] = await tx
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

  return slot;
};

export const findEventTypePriceByIdRepo = async (
  eventTypeId: number,
  tx: DbOrTx = db
) => {
  const [eventType] = await tx
    .select({ price: eventTypes.price })
    .from(eventTypes)
    .where(eq(eventTypes.id, eventTypeId))
    .limit(1);

  return eventType;
};

export const extendSlotHoldRepo = async (
  slotId: number,
  extendedHoldExpiresAt: Date,
  tx: DbOrTx = db
) => {
  return await tx
    .update(slots)
    .set({ holdExpiresAt: extendedHoldExpiresAt, updatedAt: new Date() })
    .where(eq(slots.id, slotId));
};

export const insertPaymentOrderRepo = async (
  values: {
    holdToken: string;
    reviewerId: number;
    amount: number;
    currency: string;
    razorpayOrderId: string;
    status: "created" | "captured" | "failed" | "refunded" | "partially_refunded";
  },
  tx: DbOrTx = db
) => {
  return await tx.insert(payments).values(values);
};

export const findPaymentByBookingIdRepo = async (
  bookingId: number,
  tx: DbOrTx = db
) => {
  const [payment] = await tx
    .select()
    .from(payments)
    .where(eq(payments.bookingId, bookingId))
    .limit(1);

  return payment;
};

export const findBookingForRefundRepo = async (
  bookingId: number,
  tx: DbOrTx = db
) => {
  const [booking] = await tx
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  return booking;
};

export const updatePaymentRefundRepo = async (
  paymentId: number,
  data: {
    status: "refunded" | "partially_refunded";
    refundId: string | null;
    refundAmount: number;
    cancellationFee: number;
    refundReason: string;
  },
  tx: DbOrTx = db
) => {
  return await tx
    .update(payments)
    .set({
      status: data.status,
      refundId: data.refundId,
      refundAmount: data.refundAmount,
      cancellationFee: data.cancellationFee,
      refundReason: data.refundReason,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentId));
};

export const findReviewerWalletForRefundRepo = async (
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

export const updateWalletForRefundRepo = async (
  walletId: number,
  newPending: number,
  newAvailable: number,
  tx: DbOrTx = db
) => {
  return await tx
    .update(reviewerWallets)
    .set({
      pendingBalance: newPending,
      availableBalance: newAvailable,
      updatedAt: new Date(),
    })
    .where(eq(reviewerWallets.id, walletId));
};

export const insertRefundWalletTransactionsRepo = async (
  transactions: Array<InferInsertModel<typeof walletTransactions>>,
  tx: DbOrTx = db
) => {
  if (transactions.length === 0) return;
  return await tx.insert(walletTransactions).values(transactions);
};

export const findPaymentByRazorpayOrderIdRepo = async (
  orderId: string,
  tx: DbOrTx = db
) => {
  const [paymentRecord] = await tx
    .select()
    .from(payments)
    .where(eq(payments.razorpayOrderId, orderId))
    .limit(1);

  return paymentRecord;
};

export const updatePaymentCapturedRepo = async (
  paymentId: number,
  razorpayPaymentId?: string | null | undefined,
  tx: DbOrTx = db
) => {
  return await tx
    .update(payments)
    .set({
      status: "captured",
      ...(razorpayPaymentId ? { razorpayPaymentId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentId));
};

export const findSlotByHoldTokenRepo = async (
  holdToken: string,
  tx: DbOrTx = db
) => {
  const [slot] = await tx
    .select()
    .from(slots)
    .where(eq(slots.holdToken, holdToken))
    .limit(1);

  return slot;
};

export const findEventTimezoneByEventTypeIdRepo = async (
  eventTypeId: number,
  tx: DbOrTx = db
) => {
  const [templateRow] = await tx
    .select({ timezone: availabilityTemplates.timezone })
    .from(eventTypes)
    .innerJoin(
      availabilityTemplates,
      eq(eventTypes.availabilityTemplateId, availabilityTemplates.id)
    )
    .where(eq(eventTypes.id, eventTypeId))
    .limit(1);

  return templateRow?.timezone;
};

export const paymentRepository = {
  findHeldSlotByTokenWithActiveExpiry: findHeldSlotByTokenWithActiveExpiryRepo,
  findEventTypePriceById: findEventTypePriceByIdRepo,
  extendSlotHold: extendSlotHoldRepo,
  insertPaymentOrder: insertPaymentOrderRepo,
  findPaymentByBookingId: findPaymentByBookingIdRepo,
  findBookingForRefund: findBookingForRefundRepo,
  updatePaymentRefund: updatePaymentRefundRepo,
  findReviewerWalletForRefund: findReviewerWalletForRefundRepo,
  updateWalletForRefund: updateWalletForRefundRepo,
  insertRefundWalletTransactions: insertRefundWalletTransactionsRepo,
  findPaymentByRazorpayOrderId: findPaymentByRazorpayOrderIdRepo,
  updatePaymentCaptured: updatePaymentCapturedRepo,
  findSlotByHoldToken: findSlotByHoldTokenRepo,
  findEventTimezoneByEventTypeId: findEventTimezoneByEventTypeIdRepo,
};
