import { and, desc, eq, gte, lte, count, sql } from "drizzle-orm";
import { db } from "../../config/db.js";
import { auditLogs } from "./auditLog.schema.js";
import dayjs from "dayjs";
import type { ListAuditLogQuery } from "./auditLog.validation.js";

type RecordAuditLogInput = {
  actorId: number;
  actorRole: "admin" | "reviewer";
  actorName: string;
  action: string;
  targetType?: string;
  targetId?: number;
  metadata?: Record<string, unknown>;
};

export const auditLogService = {
  recordAuditLog: async (input: RecordAuditLogInput) => {
    try {
      await db.insert(auditLogs).values({
        actorId: input.actorId,
        actorRole: input.actorRole,
        actorName: input.actorName,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        metadata: input.metadata,
      });
    } catch (error) {
      console.error("Failed to record audit log:", error);
    }
  },

  // GET /api/admin/audit-log
  listAuditLogs: async (query: ListAuditLogQuery) => {
    const { action, actorId, targetType, fromDate, toDate, page = 1, limit = 5 } = query;

    const conditions = [];
    if (action) conditions.push(eq(auditLogs.action, action));
    if (actorId) conditions.push(eq(auditLogs.actorId, actorId));
    if (targetType) conditions.push(eq(auditLogs.targetType, targetType));
    if (fromDate) conditions.push(gte(auditLogs.createdAt, dayjs(fromDate).startOf("day").toDate()));
    if (toDate) conditions.push(lte(auditLogs.createdAt, dayjs(toDate).endOf("day").toDate()));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const todayStart = dayjs().startOf("day").toDate();

    const [rows, totalResult, statsResult] = await Promise.all([
      db
        .select()
        .from(auditLogs)
        .where(where)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ total: count() }).from(auditLogs).where(where),
      db
        .select({
          totalEvents: sql<number>`count(*)::int`,
          todayEvents: sql<number>`count(case when ${auditLogs.createdAt} >= ${todayStart} then 1 end)::int`,
          securityEvents: sql<number>`count(case when ${auditLogs.action} in ('reviewer.reactivated', 'reviewer.deactivated', 'admin.profile_updated', 'admin.password_changed') or ${auditLogs.action} ilike '%security%' or ${auditLogs.action} ilike '%status%' or ${auditLogs.action} ilike '%password%' then 1 end)::int`,
          financialEvents: sql<number>`count(case when ${auditLogs.action} ilike '%payout%' or ${auditLogs.action} ilike '%dispute%' or ${auditLogs.action} ilike '%refund%' or ${auditLogs.action} ilike '%payment%' then 1 end)::int`,
        })
        .from(auditLogs),
    ]);

    const total = totalResult[0]?.total ?? 0;
    const rawStats = statsResult[0];
    const stats = {
      totalEvents: Number(rawStats?.totalEvents ?? 0),
      todayEvents: Number(rawStats?.todayEvents ?? 0),
      securityEvents: Number(rawStats?.securityEvents ?? 0),
      financialEvents: Number(rawStats?.financialEvents ?? 0),
    };

    return {
      logs: rows,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      stats,
    };
  },
};