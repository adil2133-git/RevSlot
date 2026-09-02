import { pgTable, serial, integer, date, text, boolean, timestamp, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { reviewers } from '../auth/reviewers.model.js';

export const vacationBlocks = pgTable(
  'vacation_blocks',
  {
    id: serial('id').primaryKey(),
    reviewerId: integer('reviewer_id').notNull().references(() => reviewers.id, { onDelete: 'cascade' }),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    reason: text('reason'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_vacation_blocks_reviewer_dates').on(table.reviewerId, table.startDate, table.endDate),
    check('valid_date_range', sql`${table.endDate} >= ${table.startDate}`),
  ]
);