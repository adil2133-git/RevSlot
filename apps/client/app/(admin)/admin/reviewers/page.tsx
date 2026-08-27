"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "@/features/admin/store/adminStore";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function AdminReviewersPage() {
  const { reviewers, reviewersPagination, isLoading, fetchReviewers, toggleReviewerStatus } =
    useAdminStore();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<number | null>(null);

  useEffect(() => {
    fetchReviewers({ search: search || undefined, status, page, limit: 20 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReviewers({ search: search || undefined, status, page: 1, limit: 20 });
  };

  const handleToggle = async (id: number, nextActive: boolean) => {
    setPendingId(id);
    try {
      await toggleReviewerStatus(id, nextActive);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-1.5 text-2xl font-semibold tracking-tight text-on-surface">
          Reviewer Management
        </h1>
        <p className="text-sm text-slate-600">View and manage reviewer accounts.</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-lg border border-slate-200 bg-surface-card px-4 py-2 text-sm text-on-surface placeholder:text-slate-400 focus:border-primary focus:outline-none"
          />
        </form>
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-surface-card p-1">
          {(["all", "active", "inactive"] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                status === s ? "bg-primary text-on-primary" : "text-slate-500 hover:bg-surface-hover"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-surface-card shadow-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-surface text-left text-xs font-medium text-slate-400">
              <th className="px-5 py-3 font-medium">Reviewer</th>
              <th className="px-5 py-3 font-medium">WhatsApp</th>
              <th className="px-5 py-3 font-medium">Email Verified</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Joined</th>
              <th className="px-5 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && reviewers.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">Loading…</td></tr>
            )}
            {!isLoading && reviewers.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">No reviewers found</td></tr>
            )}
            {reviewers.map((r) => (
              <tr key={r.id} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary">
                      {initials(r.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-on-surface">{r.name}</p>
                      <p className="truncate text-xs text-slate-400">{r.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-600">{r.whatsappNumber}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.emailVerified ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {r.emailVerified ? "Verified" : "Unverified"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {r.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    disabled={pendingId === r.id}
                    onClick={() => handleToggle(r.id, !r.isActive)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                      r.isActive
                        ? "border border-red-200 text-red-600 hover:bg-red-50"
                        : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    {pendingId === r.id ? "…" : r.isActive ? "Deactivate" : "Reactivate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reviewersPagination && reviewersPagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            Page {reviewersPagination.page} of {reviewersPagination.totalPages} · {reviewersPagination.total} total
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
              disabled={page >= reviewersPagination.totalPages}
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