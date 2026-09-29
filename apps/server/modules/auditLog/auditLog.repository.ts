import { and, desc, eq, gte, lte, count, sql, type InferInsertModel } from "drizzle-orm";
import { db } from "../../config/db.js";
import { auditLogs } from "./auditLog.schema.js";

export type NewAuditLog = InferInsertModel<typeof auditLogs>;

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | Transaction;

export interface FindAuditLogsFilter {
  action?: string | undefined;
  actorId?: number | undefined;
  targetType?: string | undefined;
  fromDate?: Date | undefined;
  toDate?: Date | undefined;
  limit: number;
  offset: number;
}

export const insertAuditLogRepo = async (
  values: NewAuditLog,
  tx: DbOrTx = db
) => {
  return await tx.insert(auditLogs).values(values);
};

export const findAuditLogsWithTotalAndStatsRepo = async (
  filter: FindAuditLogsFilter,
  todayStart: Date,
  tx: DbOrTx = db
) => {
  const conditions = [];
  if (filter.action) conditions.push(eq(auditLogs.action, filter.action));
  if (filter.actorId) conditions.push(eq(auditLogs.actorId, filter.actorId));
  if (filter.targetType) conditions.push(eq(auditLogs.targetType, filter.targetType));
  if (filter.fromDate) conditions.push(gte(auditLogs.createdAt, filter.fromDate));
  if (filter.toDate) conditions.push(lte(auditLogs.createdAt, filter.toDate));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalResult, statsResult] = await Promise.all([
    tx
      .select()
      .from(auditLogs)
      .where(where)
      .orderBy(desc(auditLogs.createdAt))
      .limit(filter.limit)
      .offset(filter.offset),
    tx.select({ total: count() }).from(auditLogs).where(where),
    tx
      .select({
        totalEvents: sql<number>`count(*)::int`,
        todayEvents: sql<number>`count(case when ${auditLogs.createdAt} >= ${todayStart} then 1 end)::int`,
        securityEvents: sql<number>`count(case when ${auditLogs.action} in ('reviewer.reactivated', 'reviewer.deactivated', 'admin.profile_updated', 'admin.password_changed') or ${auditLogs.action} ilike '%security%' or ${auditLogs.action} ilike '%status%' or ${auditLogs.action} ilike '%password%' then 1 end)::int`,
        financialEvents: sql<number>`count(case when ${auditLogs.action} ilike '%payout%' or ${auditLogs.action} ilike '%dispute%' or ${auditLogs.action} ilike '%refund%' or ${auditLogs.action} ilike '%payment%' then 1 end)::int`,
      })
      .from(auditLogs),
  ]);

  return {
    rows,
    total: totalResult[0]?.total ?? 0,
    rawStats: statsResult[0],
  };
};

export const auditLogRepository = {
  insertAuditLog: insertAuditLogRepo,
  findAuditLogsWithTotalAndStats: findAuditLogsWithTotalAndStatsRepo,
};
