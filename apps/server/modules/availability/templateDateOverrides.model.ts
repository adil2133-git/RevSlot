import { pgTable, serial, integer, date, boolean, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { availabilityTemplates } from './availabilityTemplates.model.js';

export const templateDateOverrides = pgTable(
  'template_date_overrides',
  {
    id: serial('id').primaryKey(),
    templateId: integer('template_id').notNull().references(() => availabilityTemplates.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    isUnavailable: boolean('is_unavailable').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique('unique_template_override_date').on(table.templateId, table.date),
    index('idx_template_date_overrides_template').on(table.templateId),
  ]
);