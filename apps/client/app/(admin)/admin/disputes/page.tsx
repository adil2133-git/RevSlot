"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { listDisputes, resolveDispute } from "@/features/admin/api/adminApi";
import AdminPagination from "@/components/admin/AdminPagination";
import type { AdminDisputeItem } from "@/features/admin/types";

export default function AdminDisputesPage() {
  const [items, setItems] = useState<AdminDisputeItem[]>([]);
  const [status, setStatus] = useState<"all" | "under_review" | "resolved_refunded" | "resolved_dismissed">("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [selectedDispute, setSelectedDispute] = useState<AdminDisputeItem | null>(null);
  const [action, setAction] = useState<"refund_client" | "dismiss">("refund_client");
  const [adminNotes, setAdminNotes] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listDisputes({
        status: status === "all" ? undefined : status,
        page,
        limit: 5,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load disputes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [status, page]);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;

    setResolving(true);
    setResolveError(null);

    try {
      await resolveDispute(selectedDispute.id, {
        action,
        adminNotes: adminNotes.trim() || undefined,
      });

      setSelectedDispute(null);
      setAdminNotes("");
      await loadData();
    } catch (err: any) {
      setResolveError(err?.response?.data?.message || "Failed to resolve dispute");
    } finally {
      setResolving(false);
    }
  };

  const pendingCount = items.filter((i) => i.status === "under_review").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Disputes & No-Shows</h1>
          <p className="mt-1 text-sm text-slate-500">
            Investigate client attendance reports, check automated room logs, and resolve refunds.
          </p>
        </div>
        <button
          onClick={loadData}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-xs w-fit">
        {(["all", "under_review", "resolved_refunded", "resolved_dismissed"] as const).map((s) => (
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
            {s === "under_review" ? `Under Review (${pendingCount})` : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading disputes...</div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No disputes found for the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Session / Booking</th>
                  <th className="px-6 py-3.5">Reviewer</th>
                  <th className="px-6 py-3.5">Client & Issue</th>
                  <th className="px-6 py-3.5">Room Logs</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      <p className="font-bold text-slate-900">{item.eventTypeName}</p>
                      <p className="text-[11px] text-slate-400">
                        {dayjs(item.startTime).format("MMM D, YYYY · h:mm A")}
                      </p>
                      <p className="font-mono text-[10px] text-slate-400">Booking #{item.bookingId}</p>
                      {item.paymentAmount ? (
                        <span className="inline-block mt-1 font-semibold text-emerald-700">
                          ₹{(item.paymentAmount / 100).toFixed(2)}
                        </span>
                      ) : null}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      <p className="font-semibold text-slate-900">{item.reviewerName}</p>
                      <p className="text-[11px] text-slate-400">{item.reviewerEmail}</p>
                    </td>

                    <td className="px-6 py-4 text-xs max-w-xs">
                      <div className="space-y-1">
                        <span className="inline-flex rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200 uppercase">
                          {item.reason.replace("_", " ")}
                        </span>
                        <p className="text-slate-800 line-clamp-2 italic">
                          &ldquo;{item.description}&rdquo;
                        </p>
                        <p className="text-[10px] text-slate-400">Reported by: {item.advisorEmail}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className={item.meetingJoinedByReviewer ? "text-emerald-600" : "text-rose-600"}>
                            {item.meetingJoinedByReviewer ? "🟢" : "🔴"}
                          </span>
                          <span className="font-medium text-slate-700">
                            Reviewer: {item.meetingJoinedByReviewer ? "Joined" : "No Attendance Logged"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={item.meetingJoinedByClient ? "text-emerald-600" : "text-slate-400"}>
                            {item.meetingJoinedByClient ? "🟢" : "⚪"}
                          </span>
                          <span className="font-medium text-slate-700">
                            Client: {item.meetingJoinedByClient ? "Joined" : "Not Logged"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.status === "under_review"
                            ? "bg-amber-100 text-amber-800"
                            : item.status === "resolved_refunded"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {item.status === "under_review" && "⚠️ Under Review"}
                        {item.status === "resolved_refunded" && "↩️ 100% Refunded"}
                        {item.status === "resolved_dismissed" && "🛡️ Dismissed (Cleared)"}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                      {item.status === "under_review" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDispute(item);
                            setAction(item.meetingJoinedByReviewer ? "dismiss" : "refund_client");
                            setAdminNotes("");
                            setResolveError(null);
                          }}
                          className="rounded-lg bg-[#003366] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#003366]/90 transition shadow-xs"
                        >
                          Resolve Dispute
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

        <AdminPagination
          page={page}
          totalPages={Math.max(1, Math.ceil(total / 5))}
          total={total}
          limit={5}
          onPageChange={setPage}
          label="disputes"
        />
      </div>

      {/* Resolution Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Resolve Dispute</h3>
            <p className="mt-1 text-xs text-slate-500">
              Booking #{selectedDispute.bookingId} · Reviewer: {selectedDispute.reviewerName}
            </p>

            {/* Attendance Evidence Panel */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Claimed Reason:</span>
                <span className="font-bold text-rose-700 uppercase">
                  {selectedDispute.reason.replace("_", " ")}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Client Statement:</span>
                <p className="mt-0.5 text-slate-800 italic bg-white p-2 rounded-lg border border-slate-200">
                  &ldquo;{selectedDispute.description}&rdquo;
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-slate-500">Room Attendance Log:</span>
                <div className="flex items-center gap-2">
                  <span className={selectedDispute.meetingJoinedByReviewer ? "text-emerald-700 font-semibold" : "text-rose-700 font-semibold"}>
                    Reviewer: {selectedDispute.meetingJoinedByReviewer ? "🟢 Present" : "🔴 Absent"}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleResolveSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAction("refund_client")}
                    className={`rounded-xl border p-2.5 text-xs font-semibold transition text-left ${
                      action === "refund_client"
                        ? "border-rose-600 bg-rose-50 text-rose-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-bold">↩️ Approve 100% Refund</p>
                    <p className="text-[10px] font-normal text-rose-600 mt-0.5">
                      Triggers Razorpay refund to client & cancels reviewer escrow.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAction("dismiss")}
                    className={`rounded-xl border p-2.5 text-xs font-semibold transition text-left ${
                      action === "dismiss"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-bold">🛡️ Dismiss Dispute</p>
                    <p className="text-[10px] font-normal text-emerald-600 mt-0.5">
                      Reviewer was present; unfreezes escrow to clear earnings.
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Resolution Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Verified reviewer absence in room logs; approved full refund."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 outline-none focus:border-primary resize-none"
                />
              </div>

              {resolveError && (
                <p className="text-xs font-medium text-red-600 p-2 rounded-lg bg-red-50 border border-red-200">
                  {resolveError}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  disabled={resolving}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold text-white transition shadow-xs ${
                    action === "refund_client"
                      ? "bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
                      : "bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                  }`}
                >
                  {resolving ? "Resolving..." : action === "refund_client" ? "Confirm & Refund Client" : "Confirm Dismissal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
