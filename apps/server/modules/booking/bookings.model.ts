import { pgTable, serial, integer, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { reviewers } from '../auth/reviewers.model.js';
import { eventTypes } from '../eventType/eventTypes.model.js';
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
  advisorEmail: varchar('advisor_email', { length: 255 }).notNull(),
  internEmails: text('intern_emails').array(),
  weekStage: varchar('week_stage', { length: 255 }).notNull(),

  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),

  status: bookingStatus('status').default('confirmed'),
  meetLink: text('meet_link'),
  googleEventId: varchar('google_event_id', { length: 255 }),

  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancelledReason: varchar('cancelled_reason', { length: 255 }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});