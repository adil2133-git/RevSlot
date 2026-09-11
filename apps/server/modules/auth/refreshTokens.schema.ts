import { pgTable, serial, integer, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { userRole } from '../../db/schema/enums.js';

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    role: userRole('role').notNull(),
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_refresh_tokens_user').on(table.userId, table.role),
    index('idx_refresh_tokens_hash').on(table.tokenHash),
  ]
);
