import type { Request, Response } from "express";
import { auditLogService } from "./auditLog.service.js";
import type { ListAuditLogQuery } from "./auditLog.schema.js";

export const auditLogController = {
  listAuditLogs: async (req: Request, res: Response) => {
    const query = res.locals.query as ListAuditLogQuery;
    const result = await auditLogService.listAuditLogs(query);
    res.status(200).json({ success: true, data: result });
  },
};