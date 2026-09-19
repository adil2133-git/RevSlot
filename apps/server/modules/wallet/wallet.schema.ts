import { pgTable, serial, integer, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { reviewers } from '../auth/reviewers.schema.js';
import { bookings } from '../booking/bookings.schema.js';
import { walletTxType, walletTxStatus, payoutMethod, payoutRequestStatus } from '../../db/schema/enums.js';

export const reviewerWallets = pgTable('reviewer_wallets', {
  id: serial('id').primaryKey(),
  reviewerId: integer('reviewer_id')
    .notNull()
    .unique()
    .references(() => reviewers.id, { onDelete: 'cascade' }),
  pendingBalance: integer('pending_balance').notNull().default(0), // in paise (escrow)
  availableBalance: integer('available_balance').notNull().default(0), // in paise (withdrawable)
  withdrawnBalance: integer('withdrawn_balance').notNull().default(0), // in paise (total withdrawn)
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const walletTransactions = pgTable('wallet_transactions', {
  id: serial('id').primaryKey(),
  reviewerId: integer('reviewer_id')
    .notNull()
    .references(() => reviewers.id, { onDelete: 'cascade' }),
  bookingId: integer('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  type: walletTxType('type').notNull(),
  amount: integer('amount').notNull(), // in paise
  status: walletTxStatus('status').notNull().default('completed'),
  description: text('description'),
  availableAt: timestamp('available_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const reviewerPayoutProfiles = pgTable('reviewer_payout_profiles', {
  id: serial('id').primaryKey(),
  reviewerId: integer('reviewer_id')
    .notNull()
    .unique()
    .references(() => reviewers.id, { onDelete: 'cascade' }),
  payoutMethod: payoutMethod('payout_method').notNull().default('bank_account'),
  accountHolderName: varchar('account_holder_name', { length: 150 }),
  accountNumber: varchar('account_number', { length: 50 }),
  ifscCode: varchar('ifsc_code', { length: 20 }),
  upiId: varchar('upi_id', { length: 100 }),
  isVerified: boolean('is_verified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const payoutRequests = pgTable('payout_requests', {
  id: serial('id').primaryKey(),
  reviewerId: integer('reviewer_id')
    .notNull()
    .references(() => reviewers.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(), // in paise
  status: payoutRequestStatus('status').notNull().default('requested'),
  transactionReference: varchar('transaction_reference', { length: 100 }),
  notes: text('notes'),
  adminNotes: text('admin_notes'),
  processedBy: integer('processed_by'),
  requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
});
