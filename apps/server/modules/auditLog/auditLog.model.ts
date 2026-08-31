import { pgTable, serial, integer, varchar, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { userRole } from '../../db/schema/enums.js';

// Records who did what to what, across the whole app — not just admin
// actions. actorRole reuses the existing userRole enum ('reviewer' |
// 'admin') so a reviewer's own actions (e.g. cancelling a booking) can
// be logged here too, not only admin-side ones.
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: serial('id').primaryKey(),

    actorId: integer('actor_id').notNull(),
    actorRole: userRole('actor_role').notNull(),
    // Denormalized so the log entry still reads correctly even if the
    // actor's name changes later, or (in principle) the account is removed.
    actorName: varchar('actor_name', { length: 150 }).notNull(),

    action: varchar('action', { length: 100 }).notNull(),
    targetType: varchar('target_type', { length: 100 }),
    targetId: integer('target_id'),

    // Free-form details specific to the action, e.g. { from: false, to: true }
    // for a reviewer status toggle. Never store secrets/passwords here.
    metadata: jsonb('metadata'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_audit_logs_created_at').on(table.createdAt),
    index('idx_audit_logs_actor').on(table.actorId, table.actorRole),
    index('idx_audit_logs_target').on(table.targetType, table.targetId),
  ]
);