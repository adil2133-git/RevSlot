import { and, desc, eq, gte, lte, count } from "drizzle-orm";
import { db } from "../../config/db.js";
import { auditLogs } from "./auditLogs.model.js";
import dayjs from "dayjs";
import type { ListAuditLogQuery } from "./auditLog.schema.js";

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
  // Write hook — call this from any module's service after a notable
  // action completes. Fire-and-forget on purpose: a logging failure
  // should never fail the action it's logging (e.g. a reviewer getting
  // deactivated shouldn't roll back just because the log insert failed).
  // Errors are swallowed here but still logged to the console for
  // visibility during development.
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
    const { action, actorId, targetType, fromDate, toDate, page, limit } = query;

    const conditions = [];
    if (action) conditions.push(eq(auditLogs.action, action));
    if (actorId) conditions.push(eq(auditLogs.actorId, actorId));
    if (targetType) conditions.push(eq(auditLogs.targetType, targetType));
    if (fromDate) conditions.push(gte(auditLogs.createdAt, dayjs(fromDate).startOf("day").toDate()));
    if (toDate) conditions.push(lte(auditLogs.createdAt, dayjs(toDate).endOf("day").toDate()));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, totalResult] = await Promise.all([
      db
        .select()
        .from(auditLogs)
        .where(where)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ total: count() }).from(auditLogs).where(where),
    ]);
    const total = totalResult[0]?.total ?? 0;

    return {
      logs: rows,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  },
};