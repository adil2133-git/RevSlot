import { pgTable, serial, integer, varchar, text, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { reviewers } from './reviewers.js';

export const questionBanks = pgTable(
  'question_banks',
  {
    id: serial('id').primaryKey(),
    reviewerId: integer('reviewer_id')
      .notNull()
      .references(() => reviewers.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 150 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique('unique_bank_name').on(table.reviewerId, table.name),
    index('idx_question_banks_reviewer').on(table.reviewerId),
  ]
);