import { pgTable, serial, integer, varchar, text, jsonb, timestamp, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { reviewers } from '../auth/reviewers.schema.js';
import { eventTypes } from '../eventType/eventTypes.schema.js';
import { bookingStatus } from '../../db/schema/enums.js';

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),

  eventTypeId: integer('event_type_id')
    .notNull()
    .references(() => eventTypes.id, { onDelete: 'restrict' }),

  reviewerId: integer('reviewer_id')
    .notNull()
    .references(() => reviewers.id, { onDelete: 'restrict' }),

  internName: varchar('intern_name', { length: 150 }).notNull(),
  batch: varchar('batch', { length: 50 }).notNull(),
  advisorName: varchar('advisor_name', { length: 150 }).notNull(),
  advisorEmail: varchar('advisor_email', { length: 255 }).notNull(),
  internEmails: text('intern_emails').array(),
  weekStage: varchar('week_stage', { length: 255 }).notNull(),
  formData: jsonb("form_data")
  .$type<Record<string, string>>()
  .notNull()
  .default({}),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),

  status: bookingStatus('status').default('confirmed'),
  meetLink: text('meet_link'),
  googleEventId: varchar('google_event_id', { length: 255 }),

  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancelledReason: varchar('cancelled_reason', { length: 255 }),

  // Self-reference: the new booking created by a reschedule points back
  // to the booking it replaced. Nullable — most bookings are never rescheduled.
  rescheduledFromBookingId: integer('rescheduled_from_booking_id').references(
    (): AnyPgColumn => bookings.id,
    { onDelete: 'set null' }
  ),

  // Two-way reschedule request fields
  proposedStartTime: timestamp('proposed_start_time', { withTimezone: true }),
  proposedEndTime: timestamp('proposed_end_time', { withTimezone: true }),
  rescheduleRequestedBy: varchar('reschedule_requested_by', { length: 50 }),
  rescheduleReason: text('reschedule_reason'),
  rescheduleToken: varchar('reschedule_token', { length: 255 }),
  rescheduleTokenExpiresAt: timestamp('reschedule_token_expires_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});