import { pgTable, serial, integer, varchar, text, boolean, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { reviewers } from '../auth/reviewers.model.js';

export const availabilityTemplates = pgTable(
  'availability_templates',
  {
    id: serial('id').primaryKey(),
    reviewerId: integer('reviewer_id').notNull().references(() => reviewers.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    timezone: varchar('timezone', { length: 50 }).notNull().default('UTC'),
    isDefault: boolean('is_default').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique('unique_template_name').on(table.reviewerId, table.name),
    index('idx_availability_templates_reviewer').on(table.reviewerId),
  ]
);