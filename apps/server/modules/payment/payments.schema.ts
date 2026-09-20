import { pgTable, serial, integer, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { bookings } from '../booking/bookings.schema.js';
import { reviewers } from '../auth/reviewers.schema.js';
import { paymentStatus } from '../../db/schema/enums.js';

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  holdToken: varchar('hold_token', { length: 100 }).notNull(),
  reviewerId: integer('reviewer_id').notNull().references(() => reviewers.id, { onDelete: 'restrict' }),
  advisorEmail: varchar('advisor_email', { length: 255 }),
  razorpayOrderId: varchar('razorpay_order_id', { length: 100 }).notNull().unique(),
  razorpayPaymentId: varchar('razorpay_payment_id', { length: 100 }).unique(),
  amount: integer('amount').notNull(), // amount in paise
  currency: varchar('currency', { length: 10 }).notNull().default('INR'),
  status: paymentStatus('status').notNull().default('created'),
  refundId: varchar('refund_id', { length: 100 }),
  refundAmount: integer('refund_amount').default(0), // amount in paise
  cancellationFee: integer('cancellation_fee').default(0), // amount in paise retained
  refundReason: text('refund_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
