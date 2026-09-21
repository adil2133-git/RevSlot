"use client";

import React, { useEffect, useState, useMemo } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  FileText,
  Shield,
  CreditCard,
  Search,
  Download,
  RotateCcw,
  Globe,
  Cloud,
  X,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { listAuditLog } from "@/features/admin/api/adminApi";
import AdminPagination from "@/components/admin/AdminPagination";
import type { AuditLogEntry, AuditLogStats, Pagination } from "@/features/admin/types";

dayjs.extend(relativeTime);

function initials(name: string) {
  if (!name) return "AD";
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getAvatarBg(actorName: string, role: string) {
  const n = (actorName || "").toLowerCase();
  if (role === "admin") return "bg-[#002b49] text-white";
  if (n.includes("system") || n.includes("cron")) return "bg-slate-800 text-slate-100";
  return "bg-[#003366] text-white";
}

interface ActionBadgeConfig {
  label: string;
  badgeBg: string;
  textColor: string;
  barColor: string;
}

function formatActionText(action: string): string {
  const map: Record<string, string> = {
    "reviewer.reactivated": "Reviewer Reactivated",
    "reviewer.deactivated": "Reviewer Deactivated",
    "admin.profile_updated": "Admin Profile Updated",
    "admin.password_changed": "Admin Password Changed",
    "payout.approved": "Payout Approved",
    "payout.rejected": "Payout Rejected",
    "dispute.resolved_refunded": "Dispute Resolved (Refunded)",
    "dispute.dismissed": "Dispute Dismissed",
    "feedback.submitted": "Feedback Submitted",
  };
  if (map[action]) return map[action];
  return action
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function getActionBadge(action: string): ActionBadgeConfig {
  const a = (action || "").toLowerCase();

  if (a.includes("approved") || a.includes("reactivated") || a.includes("verified")) {
    return {
      label: formatActionText(action),
      badgeBg: "bg-emerald-50 border border-emerald-200/70",
      textColor: "text-emerald-900",
      barColor: "bg-emerald-500",
    };
  }

  if (a.includes("deactivated") || a.includes("suspended") || a.includes("declined") || a.includes("rejected")) {
    return {
      label: formatActionText(action),
      badgeBg: "bg-rose-50 border border-rose-200/70",
      textColor: "text-rose-900",
      barColor: "bg-rose-500",
    };
  }

  if (a.includes("password") || a.includes("refunded") || a.includes("modified") || a.includes("updated")) {
    return {
      label: formatActionText(action),
      badgeBg: "bg-amber-50 border border-amber-200/70",
      textColor: "text-amber-900",
      barColor: "bg-amber-500",
    };
  }

  return {
    label: formatActionText(action),
    badgeBg: "bg-blue-50 border border-blue-200/70",
    textColor: "text-[#002b49]",
    barColor: "bg-[#002b49]",
  };
}

function formatTargetEntity(entry: AuditLogEntry) {
  if (!entry.targetType) {
    return {
      code: "—",
      label: "System Configuration",
    };
  }

  const type = entry.targetType.toUpperCase();
  const idStr = entry.targetId ? String(entry.targetId).padStart(4, "0") : "—";
  const code = `#${type.slice(0, 4)}-${idStr}`;

  let label = `${entry.targetType.charAt(0).toUpperCase() + entry.targetType.slice(1)} #${entry.targetId || ""}`;

  if (entry.metadata && typeof entry.metadata === "object") {
    const meta = entry.metadata as Record<string, any>;
    if (meta.reviewerName) label = `Reviewer: ${meta.reviewerName}`;
    else if (meta.name) label = String(meta.name);
    else if (meta.email) label = String(meta.email);
    else if (meta.advisorEmail) label = `Advisor: ${meta.advisorEmail}`;
    else if (meta.amountRupees) label = `₹${meta.amountRupees}`;
    else if (meta.description) label = String(meta.description);
  }

  return { code, label };
}

function getIpLocation(entry: AuditLogEntry) {
  const meta = (entry.metadata as Record<string, any>) || {};
  const isSys = entry.actorName.toLowerCase().includes("cron") || entry.actorName.toLowerCase().includes("system");

  if (isSys) {
    return {
      isSystem: true,
      ip: "System Internal",
      location: "Automated Routine",
    };
  }

  const ip = meta.ip || meta.clientIp || meta.ipAddress || (entry.actorRole === "admin" ? "Admin Console" : "Web Portal");
  const location = meta.location || meta.city || "—";

  return { isSystem: false, ip, location };
}

function formatTimeDisplay(isoDate: string) {
  const d = dayjs(isoDate);
  const now = dayjs();
  const diffHours = now.diff(d, "hour");

  let relative = d.fromNow();
  if (diffHours < 1) relative = `${Math.max(1, now.diff(d, "minute"))}m ago`;
  else if (diffHours < 24) relative = `${diffHours}h ago`;
  else if (diffHours < 48) relative = "Yesterday";

  const exact = d.isSame(now, "day")
    ? `Today, ${d.format("hh:mm A")}`
    : d.format("MMM DD, YYYY · hh:mm A");

  return { relative, exact };
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1,
  });
  const [stats, setStats] = useState<AuditLogStats>({
    totalEvents: 0,
    todayEvents: 0,
    securityEvents: 0,
    financialEvents: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [actorRoleFilter, setActorRoleFilter] = useState<"all" | "admin" | "reviewer">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "last7" | "last30">("all");
  const [page, setPage] = useState(1);

  // Detail Modal State
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let fromDate: string | undefined;
      let toDate: string | undefined;

      if (dateFilter === "today") {
        fromDate = dayjs().startOf("day").toISOString();
        toDate = dayjs().endOf("day").toISOString();
      } else if (dateFilter === "last7") {
        fromDate = dayjs().subtract(6, "day").startOf("day").toISOString();
        toDate = dayjs().endOf("day").toISOString();
      } else if (dateFilter === "last30") {
        fromDate = dayjs().subtract(29, "day").startOf("day").toISOString();
        toDate = dayjs().endOf("day").toISOString();
      }

      const res = await listAuditLog({
        action: actionFilter === "all" ? undefined : actionFilter,
        fromDate,
        toDate,
        page,
        limit: 5,
      });

      setLogs(res.logs || []);
      setPagination(res.pagination || { page: 1, limit: 5, total: 0, totalPages: 1 });
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, dateFilter, page]);

  // Client-side actor role & search filtering
  const filteredLogs = useMemo(() => {
    let list = logs;

    if (actorRoleFilter !== "all") {
      list = list.filter((l) => l.actorRole === actorRoleFilter);
    }

    if (!search.trim()) return list;
    const q = search.toLowerCase().trim();
    return list.filter(
      (l) =>
        l.actorName?.toLowerCase().includes(q) ||
        l.action?.toLowerCase().includes(q) ||
        l.targetType?.toLowerCase().includes(q) ||
        l.id.toString().includes(q)
    );
  }, [logs, search, actorRoleFilter]);

  // CSV Export Generator
  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = [
      "ID",
      "Actor Name",
      "Actor Role",
      "Action",
      "Target Type",
      "Target ID",
      "Created At",
    ];

    const rows = logs.map((l) => [
      l.id,
      `"${(l.actorName || "").replace(/"/g, '""')}"`,
      l.actorRole,
      `"${(l.action || "").replace(/"/g, '""')}"`,
      l.targetType || "",
      l.targetId || "",
      l.createdAt ? dayjs(l.createdAt).format("YYYY-MM-DD HH:mm:ss") : "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit_log_${dayjs().format("YYYY-MM-DD")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Audit Log
            </h1>
            {/* Live Syncing Badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-0.5 text-[11px] font-bold text-emerald-800 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Syncing · Retention: 365 Days</span>
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Track administrative operations, reviewer status changes, financial approvals, and security events.
          </p>
        </div>

        {/* Top Right: Export Button */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Top 3 Metric Cards (100% Real Database Values) */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Card 1: TOTAL EVENTS TODAY */}
        <div className="relative rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-slate-300 flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-extrabold tracking-wider text-slate-500 uppercase">
                Total Events Today
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf1f9] text-[#003366]">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {stats.todayEvents}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200/60 px-1.5 py-0.5 text-[10px] font-bold text-[#003366]">
              <span>{stats.totalEvents}</span>
            </span>
            <span className="truncate">total all-time event(s) recorded</span>
          </div>
        </div>

        {/* Card 2: SECURITY & ROLE MODIFIERS */}
        <div className="relative rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-slate-300 flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-extrabold tracking-wider text-slate-500 uppercase">
                Security & Role Modifiers
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf1f9] text-[#003366]">
                <Shield className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {stats.securityEvents}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              {stats.securityEvents === 0 ? "Zero critical elevation alerts" : `${stats.securityEvents} security/role modification(s)`}
            </span>
          </div>
        </div>

        {/* Card 3: APPROVALS & DISBURSEMENTS */}
        <div className="relative rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-slate-300 flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-extrabold tracking-wider text-slate-500 uppercase">
                Approvals & Disbursements
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf1f9] text-[#003366]">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {stats.financialEvents}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#003366] shrink-0" />
            <span className="truncate">
              {stats.financialEvents === 0 ? "No pending financial actions" : `${stats.financialEvents} payout & dispute record(s)`}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Search & Multi-level Filter Controls */}
      <div className="space-y-3">
        {/* Row 1: Search, Action Types Dropdown, Date Range Dropdown */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by actor, target entity, or action…"
              className="w-full rounded-2xl border border-slate-200/90 bg-white py-2 pr-9 pl-9 text-xs text-slate-800 placeholder-slate-400 focus:border-[#002b49] focus:outline-none focus:ring-2 focus:ring-[#002b49]/10"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Action Types Dropdown */}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 focus:border-[#002b49] focus:outline-none cursor-pointer"
          >
            <option value="all">All Action Types</option>
            <option value="reviewer.reactivated">Reviewer Reactivated</option>
            <option value="reviewer.deactivated">Reviewer Deactivated</option>
            <option value="admin.profile_updated">Admin Profile Updated</option>
            <option value="admin.password_changed">Admin Password Changed</option>
            <option value="payout.approved">Payout Approved</option>
            <option value="payout.rejected">Payout Rejected</option>
            <option value="dispute.resolved_refunded">Dispute Refunded</option>
            <option value="dispute.dismissed">Dispute Dismissed</option>
          </select>

          {/* Real Date Range Dropdown */}
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 w-full sm:w-auto shrink-0">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as any);
                setPage(1);
              }}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Row 2: Actor Role Filter Pills & Refresh */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center rounded-2xl border border-slate-200/90 bg-white p-1 shadow-2xs w-fit">
            <button
              type="button"
              onClick={() => {
                setActorRoleFilter("all");
                setPage(1);
              }}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                actorRoleFilter === "all"
                  ? "bg-[#002b49] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Actors
            </button>
            <button
              type="button"
              onClick={() => {
                setActorRoleFilter("admin");
                setPage(1);
              }}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                actorRoleFilter === "admin"
                  ? "bg-[#002b49] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Admins
            </button>
            <button
              type="button"
              onClick={() => {
                setActorRoleFilter("reviewer");
                setPage(1);
              }}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                actorRoleFilter === "reviewer"
                  ? "bg-[#002b49] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Reviewers
            </button>
          </div>

          <button
            type="button"
            onClick={fetchLogs}
            title="Refresh Audit Feed"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 transition cursor-pointer shrink-0"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 4. Main Data Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        {isLoading && logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#002b49] border-t-transparent" />
              <span>Streaming audit events…</span>
            </div>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-xs text-rose-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-rose-500" />
            <p className="font-bold">{error}</p>
            <button
              onClick={fetchLogs}
              className="mt-3 rounded-xl bg-[#002b49] text-white text-xs font-bold px-3 py-1.5 cursor-pointer"
            >
              Retry Loading
            </button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#003366] mb-3">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No activity recorded yet</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              There are no matching audit log events for the selected actor or action filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 pl-6 pr-4">Actor</th>
                  <th className="px-4 py-3.5">Action</th>
                  <th className="px-4 py-3.5">Target Entity</th>
                  <th className="px-4 py-3.5">IP & Channel</th>
                  <th className="px-4 py-3.5">Timestamp</th>
                  <th className="py-3.5 pr-6 text-right w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((entry) => {
                  const badge = getActionBadge(entry.action);
                  const target = formatTargetEntity(entry);
                  const net = getIpLocation(entry);
                  const time = formatTimeDisplay(entry.createdAt);

                  const actorHandle =
                    entry.actorRole === "admin"
                      ? `@${entry.actorName.toLowerCase().replace(/\s+/g, "")} · Admin Console`
                      : `@${entry.actorName.toLowerCase().replace(/\s+/g, "")} · Reviewer`;

                  return (
                    <tr
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                    >
                      {/* 1. Actor */}
                      <td className="py-4 pl-6 pr-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold shadow-2xs ${getAvatarBg(
                              entry.actorName,
                              entry.actorRole
                            )}`}
                          >
                            {initials(entry.actorName || "Admin")}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">
                              {entry.actorName}
                            </p>
                            <p className="text-[11px] text-slate-400 font-medium">
                              {actorHandle}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Action Badge with Left Vertical Bar */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div
                          className={`inline-flex items-center gap-2 rounded-xl px-2.5 py-1 text-xs font-bold ${badge.badgeBg} ${badge.textColor}`}
                        >
                          <span className={`h-3 w-1 rounded-full ${badge.barColor}`} />
                          <span>{badge.label}</span>
                        </div>
                      </td>

                      {/* 3. Target Entity */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                            {target.code}
                          </span>
                          <span className="font-semibold text-slate-800 text-xs truncate max-w-[220px]">
                            {target.label}
                          </span>
                        </div>
                      </td>

                      {/* 4. IP & Channel */}
                      <td className="px-4 py-4 whitespace-nowrap text-xs">
                        {net.isSystem ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-800 font-medium">
                              <Cloud className="h-3.5 w-3.5 text-slate-400" />
                              <span>{net.ip}</span>
                            </div>
                            <p className="text-[10px] text-slate-400">{net.location}</p>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-800 font-medium">
                              <Globe className="h-3.5 w-3.5 text-slate-400" />
                              <span>{net.ip}</span>
                            </div>
                            {net.location !== "—" && (
                              <p className="text-[10px] text-slate-400 font-medium">
                                • {net.location}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 5. Timestamp */}
                      <td className="px-4 py-4 whitespace-nowrap text-xs">
                        <p className="font-bold text-slate-900">{time.relative}</p>
                        <p className="text-[10px] text-slate-400">{time.exact}</p>
                      </td>

                      {/* 6. Inspection Trigger */}
                      <td className="py-4 pr-6 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEntry(entry);
                          }}
                          className="text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Unified Pagination (5 items per page) */}
        <AdminPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={5}
          onPageChange={(newPage) => setPage(newPage)}
          label="audit events"
        />
      </div>

      {/* 5. Inspection / Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-[#002b49] mb-1">
                  Event #{selectedEntry.id}
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Audit Event Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div>
                  <p className="text-slate-400 font-medium">Actor</p>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedEntry.actorName}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{selectedEntry.actorRole}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Action</p>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedEntry.action}</p>
                  <p className="text-[10px] text-slate-500">
                    {dayjs(selectedEntry.createdAt).format("MMM DD, YYYY · hh:mm:ss A")}
                  </p>
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-700 mb-1">Target</p>
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-800">
                  {selectedEntry.targetType ? `${selectedEntry.targetType} (ID: ${selectedEntry.targetId || "N/A"})` : "System / Global"}
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-700 mb-1">Payload / Metadata Diff</p>
                <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                  {JSON.stringify(selectedEntry.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="rounded-xl bg-[#002b49] px-4 py-2 text-xs font-bold text-white hover:bg-[#00223a] transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}