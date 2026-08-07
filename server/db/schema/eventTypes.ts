import { pgTable, serial, integer, varchar, text, smallint, boolean, timestamp, unique, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { reviewers } from './reviewers.js';
import { availabilityTemplates } from './availabilityTemplates.js';

export const eventTypes = pgTable(
    'event_types',
    {
        id: serial('id').primaryKey(),
        reviewerId: integer('reviewer_id').notNull().references(() => reviewers.id, { onDelete: 'cascade' }),
        availabilityTemplateId: integer('availability_template_id').notNull().references(() => availabilityTemplates.id, { onDelete: 'restrict' }),
        name: varchar('name', { length: 150 }).notNull(),
        slug: varchar('slug', { length: 100 }).notNull(),
        durationMinutes: smallint('duration_minutes').notNull(),
        description: text('description'),
        isActive: boolean('is_active').default(true),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    },
    (table) => [
        unique('unique_event_type_slug').on(table.reviewerId, table.slug),
        index('idx_event_types_reviewer').on(table.reviewerId),
        index('idx_event_types_template').on(table.availabilityTemplateId),
        check('valid_duration', sql`${table.durationMinutes} > 0`),
    ]
);