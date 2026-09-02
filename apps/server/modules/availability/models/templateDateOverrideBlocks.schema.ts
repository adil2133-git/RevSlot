import { sql } from 'drizzle-orm'
import { pgTable, serial, integer, smallint, time } from 'drizzle-orm/pg-core';
import { check } from 'drizzle-orm/pg-core';
import { templateDateOverrides } from './templateDateOverrides.schema.js';

export const templateOverrideBlocks = pgTable(
  'template_override_blocks',
  {
    id: serial('id').primaryKey(),
    overrideId: integer('override_id').notNull().references(() => templateDateOverrides.id, { onDelete: 'cascade' }),
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
    displayOrder: smallint('display_order'),
  },
  (table) => [
    check('valid_override_time_range', sql`${table.endTime} > ${table.startTime}`),
  ]
);