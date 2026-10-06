import dayjs from "dayjs";
import type { ListAuditLogQuery } from "./auditLog.validation.js";
import {
  insertAuditLogRepo,
  findAuditLogsWithTotalAndStatsRepo,
  type NewAuditLog,
} from "./auditLog.repository.js";

type RecordAuditLogInput = NewAuditLog;

export const auditLogService = {
  recordAuditLog: async (input: RecordAuditLogInput) => {
    try {
      await insertAuditLogRepo({
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

    const todayStart = dayjs().startOf("day").toDate();
    const fromDateTime = fromDate ? dayjs(fromDate).startOf("day").toDate() : undefined;
    const toDateTime = toDate ? dayjs(toDate).endOf("day").toDate() : undefined;

    const { rows, total, rawStats } = await findAuditLogsWithTotalAndStatsRepo(
      {
        action,
        actorId,
        targetType,
        fromDate: fromDateTime,
        toDate: toDateTime,
        limit,
        offset: (page - 1) * limit,
      },
      todayStart
    );

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