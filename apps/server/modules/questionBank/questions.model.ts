import { pgTable, serial, integer, text, smallint, timestamp, index } from 'drizzle-orm/pg-core';
import { questionBanks } from './questionBanks.model.js';

export const questions = pgTable(
  'questions',
  {
    id: serial('id').primaryKey(),
    bankId: integer('bank_id')
      .notNull()
      .references(() => questionBanks.id, { onDelete: 'cascade' }),
    questionText: text('question_text').notNull(),
    description: text('description'),
    displayOrder: smallint('display_order'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_questions_bank').on(table.bankId),
    index('idx_questions_order').on(table.bankId, table.displayOrder),
  ]
);