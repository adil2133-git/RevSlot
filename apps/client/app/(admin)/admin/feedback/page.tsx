"use client";

import { useEffect, useState, useMemo } from "react";
import { useAdminStore } from "@/features/admin/store/adminStore";
import type { AdminFeedbackItem, AdminFeedbackDetails } from "@/features/admin/types";

function initials(name: string) {
  if (!name) return "??";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${month} ${day}, ${year} · ${hours}:${mins}`;
}

export default function AdminFeedbackHistoryPage() {
  const {
    feedbackHistory,
    feedbackPagination,
    isFeedbackLoading,
    reviewers,
    fetchFeedbackHistory,
    fetchFeedbackDetails,
    fetchReviewers,
  } = useAdminStore();

  const [search, setSearch] = useState("");
  const [selectedReviewerId, setSelectedReviewerId] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<AdminFeedbackItem | AdminFeedbackDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    fetchReviewers({ limit: 100 });
  }, [fetchReviewers]);

  useEffect(() => {
    fetchFeedbackHistory({
      search: search.trim() || undefined,
      reviewerId: selectedReviewerId !== "all" ? Number(selectedReviewerId) : undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      page,
      limit: 10,
    });
  }, [search, selectedReviewerId, fromDate, toDate, page, fetchFeedbackHistory]);

  const handleOpenDetails = async (item: AdminFeedbackItem) => {
    setSelectedItem(item);
    setIsLoadingDetails(true);
    try {
      const details = await fetchFeedbackDetails(item.id);
      setSelectedItem(details);
    } catch {
      // Keep basic item info if detailed fetch fails
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const totalCount = feedbackPagination?.total ?? feedbackHistory.length;
  const totalPages = feedbackPagination?.totalPages ?? Math.max(1, Math.ceil(totalCount / 10));

  const handleClearFilters = () => {
    setSearch("");
    setSelectedReviewerId("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || selectedReviewerId !== "all" || fromDate || toDate);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Feedback History
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Review feedback submitted across all sessions.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100/90 bg-white p-3.5 shadow-sm">
        {/* Search Bar */}
        <div className="relative min-w-[260px] flex-1">
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by intern, advisor, or reviewer name..."
            className="w-full rounded-xl border border-slate-200/80 bg-[#f8fafc] py-2 pl-9 pr-4 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#003366] focus:bg-white focus:outline-none transition-colors"
          />
        </div>

        {/* Reviewer Dropdown */}
        <div className="relative">
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <select
            value={selectedReviewerId}
            onChange={(e) => {
              setSelectedReviewerId(e.target.value);
              setPage(1);
            }}
            className="appearance-none rounded-xl border border-slate-200/80 bg-[#f8fafc] py-2 pl-9 pr-9 text-xs sm:text-sm font-medium text-slate-700 hover:border-slate-300 focus:border-[#003366] focus:bg-white focus:outline-none cursor-pointer transition-colors"
          >
            <option value="all">All Reviewers</option>
            {reviewers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>

        {/* From Date Box */}
        <div className="relative flex items-center rounded-xl border border-slate-200/80 bg-[#f8fafc] px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:border-slate-300 transition-colors">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 text-slate-400 shrink-0"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            aria-label="From Date"
            className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
          />
        </div>

        {/* To Date Box */}
        <div className="relative flex items-center rounded-xl border border-slate-200/80 bg-[#f8fafc] px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:border-slate-300 transition-colors">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 text-slate-400 shrink-0"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            aria-label="To Date"
            className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Main Table Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4">REVIEWER</th>
                <th className="px-6 py-4">INTERN / ADVISOR</th>
                <th className="px-6 py-4">FEEDBACK FORM</th>
                <th className="px-6 py-4">SUBMITTED DATE</th>
                <th className="px-6 py-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {isFeedbackLoading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2.5">
                      <svg className="h-5 w-5 animate-spin text-[#003366]" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span className="text-sm font-medium">Loading feedback submissions...</span>
                    </div>
                  </td>
                </tr>
              ) : feedbackHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <div className="mx-auto flex max-w-sm flex-col items-center justify-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-slate-700">No feedback submissions found</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {hasActiveFilters
                          ? "Try clearing or adjusting your search filters."
                          : "Feedback submitted by reviewers during project reviews will appear here in real-time."}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={handleClearFilters}
                          className="mt-4 rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                feedbackHistory.map((item) => (
                  <tr
                    key={item.id}
                    className="group transition-colors hover:bg-slate-50/60"
                  >
                    {/* Reviewer column with avatar */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dce6f2] text-xs font-bold text-[#0a2540] transition-transform group-hover:scale-105">
                          {initials(item.reviewerName)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-[#003366] transition-colors leading-snug">
                            {item.reviewerName}
                          </p>
                          <p className="text-xs text-slate-400 font-normal mt-0.5">
                            {item.reviewerBio || item.reviewerEmail || "Academic Reviewer"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Intern / Advisor column */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 leading-snug">{item.internName}</p>
                      <p className="text-xs text-slate-500 font-normal mt-0.5">
                        Adv: {item.advisorName || item.advisorEmail || "—"}
                      </p>
                    </td>

                    {/* Feedback Form pill badge */}
                    <td className="px-6 py-4">
                      {item.isNoShow ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3.5 py-1 text-xs font-semibold text-red-700 border border-red-100">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          No-Show Record
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-[#e8f1fb] px-3.5 py-1 text-xs font-semibold text-[#1b365d]">
                          {item.formName || item.eventTypeName || "Evaluation Form"}
                        </span>
                      )}
                    </td>

                    {/* Submitted Date */}
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      {formatDate(item.createdAt)}
                    </td>

                    {/* Action link */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenDetails(item)}
                        className="inline-flex items-center gap-1 text-sm font-bold text-slate-900 transition-all hover:text-[#003366] hover:translate-x-0.5 active:scale-95 cursor-pointer"
                      >
                        View <span aria-hidden="true">→</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        {feedbackHistory.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-6 py-4 sm:flex-row">
            <p className="text-xs font-medium text-slate-500">
              Showing <span className="font-semibold text-slate-700">{(page - 1) * 10 + 1}</span> to{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(page * 10, totalCount)}
              </span>{" "}
              of <span className="font-semibold text-slate-700">{totalCount}</span> submissions
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-slate-900 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                Prev
              </button>

              {/* Pagination Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pNum = i + 1;
                const isActive = pNum === page;
                return (
                  <button
                    key={pNum}
                    onClick={() => setPage(pNum)}
                    className={`h-7 w-7 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#001f3f] text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}

              {totalPages > 5 && (
                <>
                  <span className="px-1 text-xs text-slate-400">...</span>
                  <button
                    onClick={() => setPage(totalPages)}
                    className={`h-7 w-7 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      page === totalPages
                        ? "bg-[#001f3f] text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-slate-900 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Submission Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            {/* Modal Header */}
            <div className="mb-6 flex items-start justify-between border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dce6f2] text-sm font-bold text-[#0a2540]">
                  {initials(selectedItem.reviewerName)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {selectedItem.formName || selectedItem.eventTypeName || "Feedback Submission"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Reviewed by <span className="font-semibold text-slate-700">{selectedItem.reviewerName}</span> on {formatDate(selectedItem.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Session & Participant Overview */}
            <div className="mb-6 grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-[#f8fafc] p-4 text-xs sm:grid-cols-4">
              <div>
                <span className="font-medium text-slate-400">Intern</span>
                <p className="mt-0.5 font-bold text-slate-800">{selectedItem.internName}</p>
              </div>
              <div>
                <span className="font-medium text-slate-400">Advisor</span>
                <p className="mt-0.5 font-bold text-slate-800">{selectedItem.advisorName || selectedItem.advisorEmail || "—"}</p>
              </div>
              <div>
                <span className="font-medium text-slate-400">Batch</span>
                <p className="mt-0.5 font-bold text-slate-800">{selectedItem.batch || "—"}</p>
              </div>
              <div>
                <span className="font-medium text-slate-400">Stage</span>
                <p className="mt-0.5 font-bold text-slate-800">{selectedItem.weekStage || "—"}</p>
              </div>
            </div>

            {/* Marks & Understanding Level */}
            {!selectedItem.isNoShow && (
              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-blue-100 bg-[#f0f6fa] p-4 text-center">
                  <span className="text-xs font-semibold text-slate-500">Review Mark</span>
                  <p className="mt-1 text-2xl font-extrabold text-[#003366]">
                    {selectedItem.reviewMark ?? "—"} <span className="text-xs font-medium text-slate-400">/ 10</span>
                  </p>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-[#f0f6fa] p-4 text-center">
                  <span className="text-xs font-semibold text-slate-500">Task Mark</span>
                  <p className="mt-1 text-2xl font-extrabold text-[#003366]">
                    {selectedItem.taskMark ?? "—"} <span className="text-xs font-medium text-slate-400">/ 10</span>
                  </p>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-[#f0f6fa] p-4 text-center">
                  <span className="text-xs font-semibold text-slate-500">Understanding</span>
                  <p className="mt-1 text-sm font-bold text-emerald-700">
                    {selectedItem.understandingLevel ?? "Proficient"}
                  </p>
                </div>
              </div>
            )}

            {/* Comments / Remarks */}
            <div className="mb-6">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Reviewer Remarks & Recommendations
              </h3>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                {selectedItem.comments || "No general remarks submitted."}
              </div>
            </div>

            {/* Custom Field Values (from item or detailed fetch) */}
            {((selectedItem as AdminFeedbackDetails).customFields?.length > 0 ||
              (selectedItem.customFieldValues && Object.keys(selectedItem.customFieldValues).length > 0)) && (
              <div className="mb-6">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Custom Field Evaluations
                </h3>
                <div className="space-y-2">
                  {(selectedItem as AdminFeedbackDetails).customFields?.map((field) => (
                    <div key={field.id} className="rounded-xl border border-slate-100 p-3 text-xs">
                      <span className="font-semibold text-slate-500">{field.label}</span>
                      <p className="mt-0.5 font-bold text-slate-800">{field.value || "—"}</p>
                    </div>
                  )) ||
                    Object.entries(selectedItem.customFieldValues || {}).map(([key, field]) => (
                      <div key={key} className="rounded-xl border border-slate-100 p-3 text-xs">
                        <span className="font-semibold text-slate-500">{field?.label || `Field #${key}`}</span>
                        <p className="mt-0.5 font-bold text-slate-800">{field?.value || "—"}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Pending / Question Bank Questions */}
            {(selectedItem as AdminFeedbackDetails).pendingQuestions?.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Question Bank Questions Evaluated
                </h3>
                <div className="space-y-2">
                  {(selectedItem as AdminFeedbackDetails).pendingQuestions.map((q) => (
                    <div key={q.id} className="rounded-xl border border-slate-100 p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-800">{q.questionText}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            q.status === "completed"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {q.status}
                        </span>
                      </div>
                      {q.description && <p className="mt-1 text-slate-500">{q.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-xl bg-[#001f3f] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#001730] transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
