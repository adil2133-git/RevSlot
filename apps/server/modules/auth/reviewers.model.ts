import { pgTable, serial, varchar, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';

// Reviewers self-register — no admin-created flow, no FK to admins here.
export const reviewers = pgTable(
  'reviewers',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 150 }).notNull(),
    username: varchar('username', {length: 50}).unique().notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash'),
    googleId: varchar('google_id', { length: 255 }).unique(), // ← new
    whatsappNumber: varchar('whatsapp_number', { length: 20 }).notNull(),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),
    isActive: boolean('is_active').default(true),
    emailVerified: boolean('email_verified').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('idx_reviewers_email').on(table.email)]
);