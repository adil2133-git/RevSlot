import {
  pgTable, serial, integer, varchar, text, boolean, smallint,
  numeric, jsonb, timestamp, unique, index,
} from 'drizzle-orm/pg-core';
import { feedbackFieldType } from '../../db/schema/enums.js';
import { reviewers } from '../auth/reviewers.model.js';
import { bookings } from '../booking/bookings.schema.js';

// A reviewer's first-ever feedback form automatically becomes their
// default (see feedback.service.ts createForm); isDefault marks it and
// it can't be deleted (see feedback.service.ts deleteForm).
export const feedbackForms = pgTable(
  'feedback_forms',
  {
    id: serial('id').primaryKey(),
    reviewerId: integer('reviewer_id')
      .notNull()
      .references(() => reviewers.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 150 }).notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique('unique_feedback_form_name').on(table.reviewerId, table.name),
    index('idx_feedback_forms_reviewer').on(table.reviewerId),
  ]
);

// Custom fields attached to a form. Base fields (Review Mark, Task Mark,
// Comments) are NOT rows here — they're fixed columns on `feedback` below,
// present on every form by default.
export const feedbackFormFields = pgTable(
  'feedback_form_fields',
  {
    id: serial('id').primaryKey(),
    formId: integer('form_id')
      .notNull()
      .references(() => feedbackForms.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 150 }).notNull(),
    fieldType: feedbackFieldType('field_type').notNull().default('text'),
    options: text('options').array(), // only populated when fieldType = 'select'
    required: boolean('required').notNull().default(false),
    displayOrder: smallint('display_order'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('idx_feedback_form_fields_form').on(table.formId)]
);

// One row per booking — the actual marks/comments/custom answers a
// reviewer submits, or a no-show record in place of them.
export const feedback = pgTable(
  'feedback',
  {
    id: serial('id').primaryKey(),
    bookingId: integer('booking_id')
      .notNull()
      .unique() // one feedback (or no-show record) per booking
      .references(() => bookings.id, { onDelete: 'cascade' }),
    reviewerId: integer('reviewer_id')
      .notNull()
      .references(() => reviewers.id, { onDelete: 'cascade' }),
    formId: integer('form_id')
      .notNull()
      .references(() => feedbackForms.id, { onDelete: 'restrict' }),
    isNoShow: boolean('is_no_show').notNull().default(false),
    reviewMark: numeric('review_mark', { precision: 3, scale: 1 }),
    taskMark: numeric('task_mark', { precision: 3, scale: 1 }),
    comments: text('comments'),
    customFieldValues: jsonb('custom_field_values')
      .$type<Record<string, { label: string; fieldType: string; value: string; options?: string[] }>>()
      .default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('idx_feedback_booking').on(table.bookingId)]
);