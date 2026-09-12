"use client";

import { useEffect, useState, useMemo } from "react";
import { listFeedbackHistory, listReviewers } from "@/features/admin/api/adminApi";
import type { AdminFeedbackHistoryItem, AdminReviewer, Pagination } from "@/features/admin/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  const timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${dateStr} · ${timeStr}`;
}

export default function AdminFeedbackHistoryPage() {
  const [feedbackList, setFeedbackList] = useState<AdminFeedbackHistoryItem[]>([]);
  const [reviewersList, setReviewersList] = useState<AdminReviewer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 9, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedReviewerId, setSelectedReviewerId] = useState<number | undefined>(undefined);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<AdminFeedbackHistoryItem | null>(null);

  const fetchFeedback = async (page = 1) => {
    try {
      setIsLoading(true);
      const res = await listFeedbackHistory({
        search: search.trim() || undefined,
        reviewerId: selectedReviewerId,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page,
        limit: 9,
      });
      setFeedbackList(res.feedback);
      setPagination(res.pagination);
    } catch (err) {
      console.error("Failed to load feedback history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    listReviewers({ limit: 100 })
      .then((res) => setReviewersList(res.reviewers))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFeedback(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedReviewerId, fromDate, toDate]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchFeedback(newPage);
    }
  };

  const startRecord = (pagination.page - 1) * pagination.limit + 1;
  const endRecord = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Feedback History
        </h1>
        <p className="text-sm text-slate-500">
          Review feedback submitted across all sessions.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-xs">
        {/* Search input */}
        <div className="relative min-w-[280px] flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by intern, advisor, or reviewer name..."
            className="w-full rounded-xl bg-slate-50/70 py-2.5 pr-4 pl-10 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
          />
        </div>

        {/* Reviewer dropdown */}
        <div className="relative min-w-[180px]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <select
            value={selectedReviewerId ?? ""}
            onChange={(e) => setSelectedReviewerId(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full appearance-none rounded-xl border border-slate-100 bg-slate-50/70 py-2.5 pr-8 pl-9 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
          >
            <option value="">All Reviewers</option>
            {reviewersList.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Date From */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-xl border border-slate-100 bg-slate-50/70 py-2.5 pr-3 pl-9 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
          />
        </div>

        {/* Date To */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-xl border border-slate-100 bg-slate-50/70 py-2.5 pr-3 pl-9 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
          />
        </div>

        {(search || selectedReviewerId || fromDate || toDate) && (
          <button
            onClick={() => {
              setSearch("");
              setSelectedReviewerId(undefined);
              setFromDate("");
              setToDate("");
            }}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                <th className="px-6 py-4">REVIEWER</th>
                <th className="px-6 py-4">INTERN / ADVISOR</th>
                <th className="px-6 py-4">FEEDBACK FORM</th>
                <th className="px-6 py-4">SUBMITTED DATE</th>
                <th className="px-6 py-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading && feedbackList.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#003366] border-t-transparent"></div>
                      <span>Loading feedback history...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && feedbackList.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No feedback records found matching your filters.
                  </td>
                </tr>
              )}

              {feedbackList.map((item) => {
                const headline = item.reviewerDepartment || "Faculty Reviewer";

                return (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50/60">
                    {/* Reviewer */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f0f8] text-xs font-bold text-[#003366]">
                          {initials(item.reviewerName)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{item.reviewerName}</div>
                          <div className="text-[11px] text-slate-400">{headline}</div>
                        </div>
                      </div>
                    </td>

                    {/* Intern / Advisor */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{item.internName}</div>
                      <div className="text-[11px] text-slate-400">Adv: {item.advisorName}</div>
                    </td>

                    {/* Feedback Form */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-[#eaf1f9] px-3 py-1 text-xs font-semibold text-[#003366]">
                        {item.formName}
                      </span>
                    </td>

                    {/* Submitted Date */}
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {formatDate(item.submittedAt)}
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedFeedback(item)}
                        className="inline-flex items-center gap-1 font-semibold text-slate-900 hover:text-[#003366]"
                      >
                        View
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-6 py-4 sm:flex-row text-xs">
          <span className="font-medium text-slate-500">
            Showing {pagination.total > 0 ? startRecord : 0} to {endRecord} of {pagination.total} submissions
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="rounded-lg px-2.5 py-1.5 font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-30"
            >
              Prev
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
              .map((page, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && page - prev > 1;

                return (
                  <div key={page} className="flex items-center gap-1.5">
                    {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                    <button
                      onClick={() => handlePageChange(page)}
                      className={`h-7 w-7 rounded-lg text-xs font-bold transition ${
                        pagination.page === page
                          ? "bg-[#002b55] text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {page}
                    </button>
                  </div>
                );
              })}

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="rounded-lg px-2.5 py-1.5 font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="inline-flex items-center rounded-full bg-[#eaf1f9] px-2.5 py-0.5 text-[11px] font-semibold text-[#003366] mb-1.5">
                  {selectedFeedback.formName}
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedFeedback.internName} - Review Feedback
                </h3>
                <p className="text-xs text-slate-500">
                  Submitted by <span className="font-semibold text-slate-700">{selectedFeedback.reviewerName}</span> on {formatDate(selectedFeedback.submittedAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 py-4 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3.5">
                <div>
                  <div className="text-slate-400 font-medium">Review Score</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedFeedback.reviewMark ? `${selectedFeedback.reviewMark} / 10` : "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Task Score</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedFeedback.taskMark ? `${selectedFeedback.taskMark} / 10` : "N/A"}
                  </div>
                </div>
              </div>

              {selectedFeedback.understandingLevel && (
                <div>
                  <span className="font-semibold text-slate-700">Understanding Level:</span>{" "}
                  <span className="capitalize text-slate-900 font-medium">{selectedFeedback.understandingLevel}</span>
                </div>
              )}

              <div>
                <div className="font-semibold text-slate-700 mb-1">Feedback Comments:</div>
                <p className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-slate-700 leading-relaxed">
                  {selectedFeedback.comments || "No general comments provided."}
                </p>
              </div>

              {selectedFeedback.isNoShow && (
                <div className="rounded-xl bg-red-50 p-3 text-red-700 font-medium">
                  Notice: Marked as No-Show by reviewer.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedFeedback(null)}
                className="rounded-xl bg-[#002b55] px-4 py-2 text-xs font-bold text-white hover:bg-[#001f3f]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
