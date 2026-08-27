import { pgTable, serial, integer, smallint, time, timestamp, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { availabilityTemplates } from './availabilityTemplates.model.js';

export const templateTimeBlocks = pgTable(
  'template_time_blocks',
  {
    id: serial('id').primaryKey(),
    templateId: integer('template_id').notNull().references(() => availabilityTemplates.id, { onDelete: 'cascade' }),
    dayOfWeek: smallint('day_of_week').notNull(),
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
    displayOrder: smallint('display_order'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_template_time_blocks_template').on(table.templateId),
    check('valid_day_of_week', sql`${table.dayOfWeek} BETWEEN 0 AND 6`),
    check('valid_time_range', sql`${table.endTime} > ${table.startTime}`),
  ]
);