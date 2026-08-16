import { pgTable, serial, integer, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { reviewers } from './reviewers.js';
import { eventTypes } from './eventTypes.js';
import { bookingStatus } from './enums.js';

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

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});