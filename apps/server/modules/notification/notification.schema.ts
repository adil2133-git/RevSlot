import { pgTable, serial, integer, varchar, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { notificationType } from '../../db/schema/enums.js';
import { reviewers } from '../auth/reviewers.schema.js';
import { bookings } from '../booking/bookings.schema.js';
export const notifications = pgTable(
  'notifications',
  {
    id: serial('id').primaryKey(),

    reviewerId: integer('reviewer_id')
      .notNull()
      .references(() => reviewers.id, { onDelete: 'cascade' }),

    type: notificationType('type').notNull(),
    title: varchar('title', { length: 150 }).notNull(),
    message: text('message').notNull(),

    // Nullable + set null on delete: a notification should still be
    // readable in history even if the booking it referenced is gone.
    bookingId: integer('booking_id').references(() => bookings.id, { onDelete: 'set null' }),

    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_notifications_reviewer_created').on(table.reviewerId, table.createdAt),
    index('idx_notifications_reviewer_unread').on(table.reviewerId, table.isRead),
  ]
);