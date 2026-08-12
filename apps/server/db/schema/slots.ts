import { pgTable, serial, integer, date, time, text, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { eventTypes } from './eventTypes.js';
import { reviewers } from './reviewers.js';
import { slotStatus } from './enums.js';

export const slots = pgTable(
  'slots',
  {
    id: serial('id').primaryKey(),
    eventTypeId: integer('event_type_id').notNull().references(() => eventTypes.id, { onDelete: 'cascade' }),
    reviewerId: integer('reviewer_id').notNull().references(() => reviewers.id, { onDelete: 'cascade' }),
    slotDate: date('slot_date').notNull(),
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
    status: slotStatus('status').default('available'),
    holdToken: text('hold_token'),
    holdExpiresAt: timestamp('hold_expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique('unique_slot_per_event').on(table.eventTypeId, table.slotDate, table.startTime),
    index('idx_slots_event_type_date').on(table.eventTypeId, table.slotDate),
    index('idx_slots_reviewer_date').on(table.reviewerId, table.slotDate),
    index('idx_slots_status').on(table.status),
    index('idx_slots_hold_expiry').on(table.holdExpiresAt).where(sql`${table.status} = 'held'`),
  ]
);