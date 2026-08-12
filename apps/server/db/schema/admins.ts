import { pgTable, serial, varchar, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';

export const admins = pgTable(
  'admins',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 150 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('idx_admins_email').on(table.email)]
);