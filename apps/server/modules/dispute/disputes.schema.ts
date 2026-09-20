import { pgTable, serial, integer, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { bookings } from '../booking/bookings.schema.js';
import { admins } from '../admin/admins.schema.js';
import { disputeReason, disputeStatus } from '../../db/schema/enums.js';

export const bookingDisputes = pgTable('booking_disputes', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id')
    .notNull()
    .references(() => bookings.id, { onDelete: 'cascade' }),
  advisorEmail: varchar('advisor_email', { length: 255 }).notNull(),
  reason: disputeReason('reason').notNull(),
  description: text('description').notNull(),
  status: disputeStatus('status').notNull().default('under_review'),
  meetingJoinedByReviewer: boolean('meeting_joined_by_reviewer').default(false),
  meetingJoinedByClient: boolean('meeting_joined_by_client').default(false),
  adminNotes: text('admin_notes'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedBy: integer('resolved_by').references(() => admins.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
