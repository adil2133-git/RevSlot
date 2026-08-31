"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "@/features/admin/store/adminStore";

const ACTION_LABELS: Record<string, string> = {
  "reviewer.reactivated": "Reviewer reactivated",
  "reviewer.deactivated": "Reviewer deactivated",
  "admin.profile_updated": "Admin profile updated",
  "admin.password_changed": "Admin password changed",
};

function actionLabel(action: string) {
  return ACTION_LABELS[action] ?? action;
}

function actionStyle(action: string) {
  if (action.endsWith("deactivated")) return "bg-red-50 text-red-700";
  if (action.endsWith("reactivated")) return "bg-emerald-50 text-emerald-700";
  return "bg-secondary text-primary";
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    ", " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function AdminAuditLogPage() {
  const { auditLog, auditLogPagination, isLoading, fetchAuditLog } = useAdminStore();
  const [action, setAction] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchAuditLog({
      action: action === "all" ? undefined : action,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      page,
      limit: 20,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, fromDate, toDate, page]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-1.5 text-2xl font-semibold tracking-tight text-on-surface">
          Audit Log
        </h1>
        <p className="text-sm text-slate-600">A record of admin actions across the platform.</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-200 bg-surface-card px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
        >
          <option value="all">All actions</option>
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-200 bg-surface-card px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
        />
        <span className="text-sm text-slate-400">to</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => { setToDate(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-200 bg-surface-card px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-surface-card shadow-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-surface text-left text-xs font-medium text-slate-400">
              <th className="px-5 py-3 font-medium">Actor</th>
              <th className="px-5 py-3 font-medium">Action</th>
              <th className="px-5 py-3 font-medium">Target</th>
              <th className="px-5 py-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && auditLog.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-slate-400">Loading…</td></tr>
            )}
            {!isLoading && auditLog.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-slate-400">No activity recorded yet</td></tr>
            )}
            {auditLog.map((entry) => (
              <tr key={entry.id} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-3">
                  <p className="font-medium text-on-surface">{entry.actorName}</p>
                  <p className="text-xs capitalize text-slate-400">{entry.actorRole}</p>
                </td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${actionStyle(entry.action)}`}>
                    {actionLabel(entry.action)}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-600">
                  {entry.targetType
                    ? `${entry.targetType}${entry.targetId ? ` #${entry.targetId}` : ""}`
                    : "—"}
                </td>
                <td className="px-5 py-3 text-slate-500">{formatDateTime(entry.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {auditLogPagination && auditLogPagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            Page {auditLogPagination.page} of {auditLogPagination.totalPages} · {auditLogPagination.total} total
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium disabled:opacity-40"
            >
              Prev
            </button>
            <button
              disabled={page >= auditLogPagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}