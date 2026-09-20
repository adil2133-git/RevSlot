"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { listPayouts, processPayout } from "@/features/admin/api/adminApi";
import type { AdminPayoutItem, AdminPayoutStats } from "@/features/admin/types";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function AdminPayoutsPage() {
  const [items, setItems] = useState<AdminPayoutItem[]>([]);
  const [stats, setStats] = useState<AdminPayoutStats>({
    pendingCount: 0,
    pendingAmount: 0,
    completedAmount: 0,
  });
  const [status, setStatus] = useState<"all" | "requested" | "completed" | "rejected">("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Process Modal State
  const [selectedPayout, setSelectedPayout] = useState<AdminPayoutItem | null>(null);
  const [action, setAction] = useState<"approve" | "reject">("approve");
  const [utrNumber, setUtrNumber] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listPayouts({
        status: status === "all" ? undefined : status,
        page,
        limit: 20,
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
  }, [status, page]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyNotice(`Copied ${label}!`);
    setTimeout(() => setCopyNotice(null), 2000);
  };

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
      await loadData();
    } catch (err: any) {
      setProcessError(err?.response?.data?.message || "Failed to process payout");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payout Requests</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review and process reviewer earnings withdrawals to their bank accounts or UPI.
          </p>
        </div>
        {copyNotice && (
          <div className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white animate-fade-in">
            {copyNotice}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Pending Approval</p>
          <p className="mt-2 text-3xl font-bold text-amber-950">{stats.pendingCount}</p>
          <p className="mt-1 text-xs text-amber-700">₹{(stats.pendingAmount / 100).toFixed(2)} awaiting payout</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Total Transferred</p>
          <p className="mt-2 text-3xl font-bold text-emerald-950">₹{(stats.completedAmount / 100).toFixed(2)}</p>
          <p className="mt-1 text-xs text-emerald-700">Successfully paid to reviewers</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Requests</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{total}</p>
          <p className="mt-1 text-xs text-slate-500">All-time withdrawal requests</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
          {(["all", "requested", "completed", "rejected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition capitalize ${
                status === s
                  ? "bg-[#003366] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {s === "requested" ? "Pending Approval" : s}
            </button>
          ))}
        </div>
        <button
          onClick={loadData}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading payout requests...</div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No payout requests found for the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Reviewer</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Destination</th>
                  <th className="px-6 py-3.5">Requested At</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#003366] text-xs font-bold text-white uppercase">
                          {initials(item.reviewerName || "Reviewer")}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-xs">{item.reviewerName}</p>
                          <p className="text-[11px] text-slate-400">{item.reviewerEmail}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-slate-900">
                        ₹{(item.amount / 100).toFixed(2)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs">
                      {item.payoutMethod === "upi" ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200 uppercase">
                            UPI
                          </span>
                          <span className="font-mono text-slate-800">{item.upiId}</span>
                          {item.upiId && (
                            <button
                              type="button"
                              onClick={() => handleCopy(item.upiId!, "UPI ID")}
                              className="text-slate-400 hover:text-slate-700 text-xs"
                              title="Copy UPI ID"
                            >
                              📋
                            </button>
                          )}
                        </div>
                      ) : item.payoutMethod === "bank_account" ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200 uppercase">
                              Bank
                            </span>
                            <span className="font-mono text-slate-800">{item.accountNumber}</span>
                            {item.accountNumber && (
                              <button
                                type="button"
                                onClick={() => handleCopy(item.accountNumber!, "Account Number")}
                                className="text-slate-400 hover:text-slate-700 text-xs"
                                title="Copy Account Number"
                              >
                                📋
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {item.accountHolderName} · IFSC: {item.ifscCode}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No details</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      {dayjs(item.requestedAt).format("MMM D, YYYY · h:mm A")}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === "requested"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {item.status === "requested" && "⏳ Pending Approval"}
                        {item.status === "completed" && "✅ Completed"}
                        {item.status === "rejected" && "❌ Rejected"}
                      </span>
                      {item.transactionReference && (
                        <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                          Ref: {item.transactionReference}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                      {item.status === "requested" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPayout(item);
                            setAction("approve");
                            setUtrNumber("");
                            setAdminNotes("");
                            setProcessError(null);
                          }}
                          className="rounded-lg bg-[#003366] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#003366]/90 transition shadow-xs"
                        >
                          Process Payout
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Process Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Process Payout Request</h3>
            <p className="mt-1 text-xs text-slate-500">
              For reviewer <span className="font-semibold text-slate-800">{selectedPayout.reviewerName}</span>
            </p>

            {/* Destination Summary Box */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Amount to Transfer:</span>
                <span className="text-sm font-bold text-slate-900">
                  ₹{(selectedPayout.amount / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method:</span>
                <span className="font-semibold text-slate-900 uppercase">
                  {selectedPayout.payoutMethod === "bank_account" ? "Bank Transfer" : "UPI ID"}
                </span>
              </div>
              {selectedPayout.payoutMethod === "upi" ? (
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-slate-500">UPI ID:</span>
                  <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
                    <span>{selectedPayout.upiId}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedPayout.upiId!, "UPI ID")}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 pt-1 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Holder:</span>
                    <span className="font-medium text-slate-800">{selectedPayout.accountHolderName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account:</span>
                    <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
                      <span>{selectedPayout.accountNumber}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedPayout.accountNumber!, "Account Number")}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">IFSC:</span>
                    <span className="font-mono text-slate-800">{selectedPayout.ifscCode}</span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleProcessSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAction("approve")}
                    className={`rounded-xl border py-2 text-xs font-semibold transition ${
                      action === "approve"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    ✅ Approve & Mark Paid
                  </button>
                  <button
                    type="button"
                    onClick={() => setAction("reject")}
                    className={`rounded-xl border py-2 text-xs font-semibold transition ${
                      action === "reject"
                        ? "border-rose-600 bg-rose-50 text-rose-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    ❌ Reject Payout
                  </button>
                </div>
              </div>

              {action === "approve" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    UTR / Transaction Reference ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UTR1234567890 or UPI Ref ID"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono outline-none focus:border-emerald-600 uppercase"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Paste the transaction reference after transferring via GPay/PhonePe/NetBanking.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rejection Reason
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Invalid bank IFSC code or account holder name mismatch"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 outline-none focus:border-rose-600 resize-none"
                  />
                  <p className="mt-1 text-[11px] text-amber-700">
                    ⚠️ Rejecting will automatically restore ₹{(selectedPayout.amount / 100).toFixed(2)} back into the reviewer&apos;s Available Balance.
                  </p>
                </div>
              )}

              {processError && (
                <p className="text-xs font-medium text-red-600 p-2 rounded-lg bg-red-50 border border-red-200">
                  {processError}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  disabled={processing}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold text-white transition shadow-xs ${
                    action === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                      : "bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
                  }`}
                >
                  {processing ? "Processing..." : action === "approve" ? "Confirm & Mark Paid" : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
