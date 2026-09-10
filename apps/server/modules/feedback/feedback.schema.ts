import {
  pgTable, serial, integer, varchar, text, boolean, smallint,
  numeric, jsonb, timestamp, unique, index,
} from 'drizzle-orm/pg-core';
import { feedbackFieldType, understandingLevel, pendingQuestionStatus } from '../../db/schema/enums.js';
import { reviewers } from '../auth/reviewers.schema.js';
import { bookings } from '../booking/bookings.schema.js';
import { questions } from '../questionBank/questions.schema.js';

export const feedbackForms = pgTable(
  'feedback_forms',
  {
    id: serial('id').primaryKey(),
    reviewerId: integer('reviewer_id')
      .notNull()
      .references(() => reviewers.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 150 }).notNull(),
    description: varchar('description', { length: 200 }),
    isDefault: boolean('is_default').notNull().default(false),
    taskMarkEnabled: boolean('task_mark_enabled').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique('unique_feedback_form_name').on(table.reviewerId, table.name),
    index('idx_feedback_forms_reviewer').on(table.reviewerId),
  ]
);

export const feedbackFormQuestions = pgTable(
  'feedback_form_questions',
  {
    id: serial('id').primaryKey(),
    formId: integer('form_id')
      .notNull()
      .references(() => feedbackForms.id, { onDelete: 'cascade' }),
    questionId: integer('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    displayOrder: smallint('display_order'),
  },
  (table) => [
    unique('unique_form_question').on(table.formId, table.questionId),
    index('idx_feedback_form_questions_form').on(table.formId),
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
    understandingLevel: understandingLevel('understanding_level'),
    customFieldValues: jsonb('custom_field_values')
      .$type<Record<string, { label: string; fieldType: string; value: string; options?: string[] | null }>>()
      .default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('idx_feedback_booking').on(table.bookingId)]
);


export const feedbackPendingQuestions = pgTable(
  'feedback_pending_questions',
  {
    id: serial('id').primaryKey(),
    feedbackId: integer('feedback_id')
      .notNull()
      .references(() => feedback.id, { onDelete: 'cascade' }),
    questionId: integer('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    status: pendingQuestionStatus('status').notNull().default('pending'),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    unique('unique_feedback_question').on(table.feedbackId, table.questionId),
    index('idx_feedback_pending_questions_feedback').on(table.feedbackId),
  ]
);