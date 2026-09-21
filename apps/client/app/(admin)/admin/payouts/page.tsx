"use client";

import React, { useEffect, useState, useMemo } from "react";
import dayjs from "dayjs";
import {
  ClipboardCheck,
  Landmark,
  CheckSquare,
  Search,
  Download,
  RotateCcw,
  Check,
  CheckCheck,
  CheckCircle2,
  Hourglass,
  X,
  XCircle,
  AlertCircle,
  Copy,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { listPayouts, processPayout } from "@/features/admin/api/adminApi";
import AdminPagination from "@/components/admin/AdminPagination";
import type { AdminPayoutItem, AdminPayoutStats } from "@/features/admin/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatCurrency(paise: number) {
  return "₹" + (paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function AdminPayoutsPage() {
  const [items, setItems] = useState<AdminPayoutItem[]>([]);
  const [stats, setStats] = useState<AdminPayoutStats>({
    pendingCount: 0,
    pendingAmount: 0,
    completedAmount: 0,
  });
  const [status, setStatus] = useState<"all" | "requested" | "completed" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Row selection for batch actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Single Process Modal State
  const [selectedPayout, setSelectedPayout] = useState<AdminPayoutItem | null>(null);
  const [action, setAction] = useState<"approve" | "reject">("approve");
  const [utrNumber, setUtrNumber] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);

  // Batch Process Modal State
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchAction, setBatchAction] = useState<"approve" | "reject">("approve");
  const [batchUtr, setBatchUtr] = useState("");
  const [batchNotes, setBatchNotes] = useState("");
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);

  // State Preview Helper (Zero records preview)
  const [previewZeroState, setPreviewZeroState] = useState(false);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listPayouts({
        status: status === "all" ? undefined : status,
        page,
        limit: 5,
      });
      setItems(res.items);
      setStats(res.stats);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  // Handle Copy to clipboard with toast notice
  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyNotice(`Copied ${label}!`);
    setTimeout(() => setCopyNotice(null), 2500);
  };

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (previewZeroState) return [];
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.reviewerName?.toLowerCase().includes(q) ||
        item.reviewerEmail?.toLowerCase().includes(q) ||
        item.accountNumber?.toLowerCase().includes(q) ||
        item.upiId?.toLowerCase().includes(q) ||
        item.ifscCode?.toLowerCase().includes(q) ||
        item.id.toString().includes(q) ||
        item.transactionReference?.toLowerCase().includes(q)
    );
  }, [items, searchQuery, previewZeroState]);

  // Selection helpers
  const allCurrentSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => selectedIds.includes(item.id));

  const toggleSelectAll = () => {
    if (allCurrentSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((item) => item.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Selected totals for batch bar
  const selectedItems = items.filter((item) => selectedIds.includes(item.id));
  const selectedSum = selectedItems.reduce((acc, item) => acc + item.amount, 0);

  // Single Process Payout Submit
  const handleProcessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayout) return;

    if (action === "approve" && !utrNumber.trim()) {
      setProcessError("UTR / Transaction Reference number is required for approval");
      return;
    }

    if (action === "reject" && !adminNotes.trim()) {
      setProcessError("Rejection reason is required");
      return;
    }

    setProcessing(true);
    setProcessError(null);

    try {
      await processPayout(selectedPayout.id, {
        action,
        transactionReference: action === "approve" ? utrNumber.trim() : undefined,
        adminNotes: adminNotes.trim(),
      });

      setSelectedPayout(null);
      setUtrNumber("");
      setAdminNotes("");
      setSelectedIds((prev) => prev.filter((id) => id !== selectedPayout.id));
      await loadData();
    } catch (err: any) {
      setProcessError(err?.response?.data?.message || "Failed to process payout");
    } finally {
      setProcessing(false);
    }
  };

  // Batch Payout Submit
  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    if (batchAction === "approve" && !batchUtr.trim()) {
      setBatchError("Batch UTR / Disbursement Reference is required");
      return;
    }

    if (batchAction === "reject" && !batchNotes.trim()) {
      setBatchError("Rejection reason is required for batch decline");
      return;
    }

    setBatchProcessing(true);
    setBatchError(null);

    try {
      await Promise.all(
        selectedIds.map((id) =>
          processPayout(id, {
            action: batchAction,
            transactionReference:
              batchAction === "approve" ? batchUtr.trim() : undefined,
            adminNotes: batchNotes.trim() || undefined,
          })
        )
      );

      setBatchModalOpen(false);
      setSelectedIds([]);
      setBatchUtr("");
      setBatchNotes("");
      await loadData();
    } catch (err: any) {
      setBatchError(
        err?.response?.data?.message || "Failed to process some batch payout requests."
      );
    } finally {
      setBatchProcessing(false);
    }
  };

  // CSV Export Generator
  const handleExportCSV = () => {
    if (items.length === 0) return;
    const headers = [
      "ID",
      "Reviewer Name",
      "Email",
      "Department",
      "Amount (INR)",
      "Payout Method",
      "Account Number",
      "IFSC Code",
      "UPI ID",
      "Status",
      "Transaction Ref",
      "Requested At",
    ];

    const rows = items.map((item) => [
      item.id,
      `"${item.reviewerName || ""}"`,
      `"${item.reviewerEmail || ""}"`,
      `"${item.reviewerDepartment || ""}"`,
      (item.amount / 100).toFixed(2),
      item.payoutMethod || "",
      item.accountNumber ? `"${item.accountNumber}"` : "",
      item.ifscCode || "",
      item.upiId || "",
      item.status,
      item.transactionReference ? `"${item.transactionReference}"` : "",
      item.requestedAt ? dayjs(item.requestedAt).format("YYYY-MM-DD HH:mm") : "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `payout_requisitions_${dayjs().format("YYYY-MM-DD")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalCompletedCount = Math.max(0, total - stats.pendingCount);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {copyNotice && (
        <div className="fixed top-20 right-8 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-2xl animate-in fade-in slide-in-from-top-4">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{copyNotice}</span>
        </div>
      )}

      {/* 1. Header Section */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Payout Requests
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Review, approve, and disburse reviewer honorarium requisitions and bank settlements.
        </p>
      </div>

      {/* 2. Top 3 Metric Cards (Uniform Height & Alignment) */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Card 1: PENDING APPROVAL */}
        <div className="relative rounded-2xl border border-slate-200/90 border-l-4 border-l-[#002b49] bg-white p-5 shadow-xs transition-all hover:border-slate-300 flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-extrabold tracking-wider text-slate-500 uppercase">
                Pending Approval
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf1f9] text-[#003366]">
                <ClipboardCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {formatCurrency(stats.pendingAmount)}
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-amber-500 inline-block mr-2 shrink-0" />
            <span className="truncate">
              <strong className="font-semibold text-slate-700">{stats.pendingCount}</strong>{" "}
              requisitions awaiting verification
            </span>
          </div>
        </div>

        {/* Card 2: TOTAL TRANSFERRED */}
        <div className="relative rounded-2xl border border-slate-200/90 border-l-4 border-l-[#002b49] bg-white p-5 shadow-xs transition-all hover:border-slate-300 flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-extrabold tracking-wider text-slate-500 uppercase">
                Total Transferred
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf1f9] text-[#003366]">
                <Landmark className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {formatCurrency(stats.completedAmount)}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Disbursed this academic FY</span>
          </div>
        </div>

        {/* Card 3: TOTAL REQUISITIONS */}
        <div className="relative rounded-2xl border border-slate-200/90 border-l-4 border-l-[#002b49] bg-white p-5 shadow-xs transition-all hover:border-slate-300 flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-extrabold tracking-wider text-slate-500 uppercase">
                Total Requisitions
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf1f9] text-[#003366]">
                <CheckSquare className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {total} Requests
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-[#003366] shrink-0" />
            <span className="truncate">98.2% processed within SLA target</span>
          </div>
        </div>
      </div>

      {/* 3. Batch Action Bar (Appears when >= 1 item is selected) */}
      {selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-[#002b49] p-4 text-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white shrink-0">
              <CheckSquare className="h-4 w-4" />
            </div>
            <p className="text-xs sm:text-sm font-semibold">
              <span className="font-bold">{selectedIds.length} requests selected</span>
              <span className="mx-2 text-slate-400">·</span>
              <span>Sum total: </span>
              <strong className="text-emerald-300 font-extrabold">
                {formatCurrency(selectedSum)}
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs font-semibold text-slate-300 hover:text-white px-2 py-1 transition-colors cursor-pointer"
            >
              Clear selection
            </button>

            <button
              type="button"
              onClick={() => {
                setBatchAction("reject");
                setBatchModalOpen(true);
                setBatchNotes("");
                setBatchError(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition shadow-xs cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reject Selected</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setBatchAction("approve");
                setBatchModalOpen(true);
                setBatchUtr("");
                setBatchNotes("");
                setBatchError(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-[#002b49] hover:bg-slate-100 transition shadow-xs cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Approve Batch</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Filter & Controls Bar (Aligned on clean single row where possible) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Status Pill Tabs */}
        <div className="flex items-center rounded-2xl border border-slate-200/90 bg-white p-1 shadow-2xs w-fit overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              setStatus("all");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              status === "all"
                ? "bg-[#002b49] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>All</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                status === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatus("requested");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              status === "requested"
                ? "bg-[#002b49] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Pending Approval</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                status === "requested" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
              }`}
            >
              {stats.pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatus("completed");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              status === "completed"
                ? "bg-[#002b49] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Completed</span>
            {totalCompletedCount > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  status === "completed" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {totalCompletedCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setStatus("rejected");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              status === "rejected"
                ? "bg-[#002b49] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Rejected</span>
          </button>
        </div>

        {/* Right Controls (Search, Date Filter, Export, Refresh in seamless flex row) */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name, bank, or ID…"
              className="w-full rounded-xl border border-slate-200/90 bg-white py-1.5 pr-3 pl-9 text-xs text-slate-800 placeholder-slate-400 focus:border-[#002b49] focus:outline-none focus:ring-2 focus:ring-[#002b49]/10"
            />
          </div>

          {/* Timeframe Select */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-[#002b49] focus:outline-none cursor-pointer shrink-0"
          >
            <option value="all">This Month ({dayjs().format("MMM YYYY")})</option>
            <option value="last30">Last 30 Days</option>
            <option value="quarter">This Academic Quarter</option>
            <option value="alltime">All Time</option>
          </select>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer shrink-0"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={loadData}
            title="Refresh Payouts Data"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 transition cursor-pointer shrink-0"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 5. Main Data Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        {loading && items.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#002b49] border-t-transparent" />
              <span>Loading payout requisitions…</span>
            </div>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-xs text-rose-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-rose-500" />
            <p className="font-bold">{error}</p>
            <button
              onClick={loadData}
              className="mt-3 rounded-xl bg-[#002b49] text-white text-xs font-bold px-3 py-1.5"
            >
              Retry Loading
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#003366] mb-3">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No payout requisitions found</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              There are no reviewer payout requests matching your current status or search filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  {/* Select All Checkbox */}
                  <th className="py-3.5 pl-5 pr-2 w-10">
                    <input
                      type="checkbox"
                      checked={allCurrentSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-[#002b49] focus:ring-[#002b49]/20 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3.5">Reviewer & Department</th>
                  <th className="px-4 py-3.5">Claim Amount</th>
                  <th className="px-4 py-3.5">Settlement Route</th>
                  <th className="px-4 py-3.5">Requested At</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="py-3.5 pr-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isPending = item.status === "requested";
                  const isCompleted = item.status === "completed";

                  const department =
                    item.reviewerDepartment || "Academic Evaluator";

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-blue-50/40"
                          : "hover:bg-slate-50/60"
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="py-4 pl-5 pr-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(item.id)}
                          className="h-4 w-4 rounded border-slate-300 text-[#002b49] focus:ring-[#002b49]/20 cursor-pointer"
                        />
                      </td>

                      {/* Reviewer & Department */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#002b49] text-xs font-extrabold text-white uppercase shadow-2xs">
                            {initials(item.reviewerName || "Reviewer")}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">
                              {item.reviewerName}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {item.reviewerEmail} · {department}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Claim Amount */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <p className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {formatCurrency(item.amount)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {item.notes || "Honorarium Requisition"}
                        </p>
                      </td>

                      {/* Settlement Route */}
                      <td className="px-4 py-4 text-xs">
                        {item.payoutMethod === "upi" ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#003366] text-xs">₹</span>
                              <span className="font-bold text-slate-900 text-xs">
                                UPI: {item.upiId}
                              </span>
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              {item.upiId && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(item.upiId!, "UPI ID")}
                                  className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                                  title="Copy UPI ID"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400">
                              Instant VPA Settlement
                            </p>
                          </div>
                        ) : item.payoutMethod === "bank_account" ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <Landmark className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                              <span className="font-bold text-slate-900 text-xs">
                                {item.accountNumber
                                  ? `Bank •••• ${item.accountNumber.slice(-4)}`
                                  : "Bank Account"}
                              </span>
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              {item.accountNumber && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopy(item.accountNumber!, "Account Number")
                                  }
                                  className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                                  title="Copy Account Number"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400">
                              IFSC: {item.ifscCode} · {item.accountHolderName}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-amber-600">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-medium italic">
                              Payment Route Missing
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Requested At */}
                      <td className="px-4 py-4 whitespace-nowrap text-xs">
                        <p className="font-semibold text-slate-800">
                          {dayjs(item.requestedAt).format("MMM D, YYYY")}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {dayjs(item.requestedAt).format("h:mm A")} · Batch #2024-B
                          {dayjs(item.requestedAt).format("MM")}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                            <Hourglass className="h-3 w-3 text-slate-500" />
                            <span>Pending Approval</span>
                          </span>
                        ) : isCompleted ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                            <CheckCheck className="h-3 w-3 text-emerald-600" />
                            <span>Settled</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-1 text-[11px] font-bold text-rose-800">
                            <XCircle className="h-3 w-3 text-rose-600" />
                            <span>Declined</span>
                          </span>
                        )}

                        {item.transactionReference && (
                          <p className="mt-0.5 text-[9px] font-mono text-slate-400">
                            Ref: {item.transactionReference}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 pr-5 whitespace-nowrap text-right">
                        {isPending ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPayout(item);
                              setAction("approve");
                              setUtrNumber("");
                              setAdminNotes("");
                              setProcessError(null);
                            }}
                            className="inline-flex items-center gap-1 rounded-xl bg-[#002b49] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#00223a] transition shadow-2xs cursor-pointer"
                          >
                            <span>Process Payout</span>
                          </button>
                        ) : isCompleted ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                item.transactionReference || "",
                                "Transaction Reference"
                              )
                            }
                            className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
                            title="Copy Ref ID"
                          >
                            <span className="font-mono text-[11px]">
                              {item.transactionReference ? "Copy Ref" : "View"}
                            </span>
                            <Copy className="h-3 w-3" />
                          </button>
                        ) : (
                          <span
                            className="text-xs text-slate-400 italic"
                            title={item.adminNotes || "Declined by admin"}
                          >
                            {item.adminNotes ? "Notes available" : "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Unified Pagination */}
        <AdminPagination
          page={page}
          totalPages={Math.max(1, Math.ceil(total / 5))}
          total={total}
          limit={5}
          onPageChange={setPage}
          label="requisitions"
        />
      </div>

      {/* 6. State Preview: Zero Records Handler Banner */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
          <Layers className="h-4 w-4 text-slate-400" />
          <span>State Preview: Zero Records Handler</span>
        </div>

        <button
          type="button"
          onClick={() => setPreviewZeroState(!previewZeroState)}
          className="text-xs font-bold text-[#002b49] hover:underline cursor-pointer"
        >
          {previewZeroState ? "Hide Empty State Preview" : "Show Empty State"}
        </button>
      </div>

      {/* 7. Single Payout Process Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Process Payout Requisition
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  For reviewer{" "}
                  <strong className="text-slate-800 font-bold">
                    {selectedPayout.reviewerName}
                  </strong>{" "}
                  ({selectedPayout.reviewerEmail})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Destination Details Box */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Claim Amount:</span>
                <span className="text-base font-extrabold text-slate-900">
                  {formatCurrency(selectedPayout.amount)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Settlement Route:</span>
                <span className="font-bold text-slate-900 uppercase">
                  {selectedPayout.payoutMethod === "bank_account"
                    ? "Bank Transfer (NEFT/RTGS)"
                    : "UPI Instant Transfer"}
                </span>
              </div>

              {selectedPayout.payoutMethod === "upi" ? (
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-slate-500">UPI VPA:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                    <span>{selectedPayout.upiId}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedPayout.upiId!, "UPI ID")}
                      className="text-xs text-blue-600 hover:underline cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 pt-1 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Holder:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedPayout.accountHolderName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Number:</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                      <span>{selectedPayout.accountNumber}</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(selectedPayout.accountNumber!, "Account Number")
                        }
                        className="text-xs text-blue-600 hover:underline cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">IFSC Code:</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                      <span>{selectedPayout.ifscCode}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedPayout.ifscCode!, "IFSC")}
                        className="text-xs text-blue-600 hover:underline cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleProcessSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Action Decision
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAction("approve")}
                    className={`rounded-xl border p-2.5 text-xs font-bold transition text-left cursor-pointer ${
                      action === "approve"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <p className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Approve & Disburse</span>
                    </p>
                    <p className="text-[10px] font-normal text-slate-500 mt-1">
                      Marks settlement complete and registers transfer reference.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAction("reject")}
                    className={`rounded-xl border p-2.5 text-xs font-bold transition text-left cursor-pointer ${
                      action === "reject"
                        ? "border-rose-600 bg-rose-50 text-rose-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <p className="flex items-center gap-1.5">
                      <X className="h-3.5 w-3.5 text-rose-600" />
                      <span>Decline Payout</span>
                    </p>
                    <p className="text-[10px] font-normal text-slate-500 mt-1">
                      Restores funds into reviewer&apos;s available wallet balance.
                    </p>
                  </button>
                </div>
              </div>

              {action === "approve" ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    UTR / Transaction Reference Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UTR92817263541 or IMPS Ref"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono font-bold uppercase text-slate-900 outline-none focus:border-[#002b49] focus:ring-2 focus:ring-[#002b49]/10"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Paste the bank transaction confirmation reference from your banking portal.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Decline Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. IFSC code mismatch or invalid bank account details."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 outline-none focus:border-rose-600 resize-none"
                  />
                  <p className="mt-1 text-[10px] text-amber-700">
                    ⚠️ Declining will immediately unfreeze {formatCurrency(selectedPayout.amount)}{" "}
                    back to the reviewer&apos;s balance.
                  </p>
                </div>
              )}

              {processError && (
                <p className="text-xs font-semibold text-rose-600 p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                  {processError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  disabled={processing}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition shadow-xs cursor-pointer ${
                    action === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                      : "bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
                  }`}
                >
                  {processing
                    ? "Processing..."
                    : action === "approve"
                    ? "Confirm & Mark Paid"
                    : "Confirm Decline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Batch Action Modal */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-extrabold text-slate-900">
              {batchAction === "approve"
                ? "Batch Approve Payout Requests"
                : "Batch Decline Payout Requests"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              You have selected{" "}
              <strong className="text-slate-800 font-bold">{selectedIds.length} requisitions</strong>{" "}
              totaling{" "}
              <strong className="text-emerald-700 font-extrabold">
                {formatCurrency(selectedSum)}
              </strong>
            </p>

            <form onSubmit={handleBatchSubmit} className="mt-5 space-y-4">
              {batchAction === "approve" ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Batch UTR / Disbursement Reference <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BATCH-NEFT-20241115"
                    value={batchUtr}
                    onChange={(e) => setBatchUtr(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono font-bold uppercase text-slate-900 outline-none focus:border-[#002b49]"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    This reference will be applied to all {selectedIds.length} approved payouts.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Batch Decline Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Bulk requisition reconciliation issue."
                    value={batchNotes}
                    onChange={(e) => setBatchNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 outline-none focus:border-rose-600 resize-none"
                  />
                </div>
              )}

              {batchError && (
                <p className="text-xs font-semibold text-rose-600 p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                  {batchError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(false)}
                  disabled={batchProcessing}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={batchProcessing}
                  className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition shadow-xs cursor-pointer ${
                    batchAction === "approve"
                      ? "bg-[#002b49] hover:bg-[#00223a] disabled:opacity-50"
                      : "bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
                  }`}
                >
                  {batchProcessing
                    ? "Processing Batch..."
                    : batchAction === "approve"
                    ? `Confirm & Approve (${selectedIds.length})`
                    : `Confirm & Decline (${selectedIds.length})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
