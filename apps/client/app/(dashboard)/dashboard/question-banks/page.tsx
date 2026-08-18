"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuestionBankStore } from "@/features/questionBanks/store/questionBankStore";

// Helper to determine icon, tags, and styling based on bank name/details
function getBankMetadata(name: string) {
  const norm = name.toLowerCase();
  
  if (norm.includes("react") || norm.includes("frontend") || norm.includes("javascript") || norm.includes("next.js") || norm.includes("nextjs") || norm.includes("ui") || norm.includes("css")) {
    return {
      tags: ["Hooks", "State"],
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
      iconBg: "bg-sky-50 text-sky-600",
      accentBar: "bg-sky-500",
    };
  }
  
  if (norm.includes("db") || norm.includes("database") || norm.includes("sql") || norm.includes("mongodb") || norm.includes("postgres") || norm.includes("system design") || norm.includes("backend")) {
    return {
      tags: norm.includes("system design") ? ["Architecture", "Scaling"] : ["Architecture", "Scaling"],
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5V19A9 3 0 0 0 21 19V5" />
          <path d="M3 12A9 3 0 0 0 21 12" />
        </svg>
      ),
      iconBg: "bg-amber-50 text-amber-600",
      accentBar: "bg-amber-500",
    };
  }
  
  if (norm.includes("perf") || norm.includes("performance") || norm.includes("speed") || norm.includes("web") || norm.includes("optimization")) {
    return {
      tags: ["CWV", "Optimization"],
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
      iconBg: "bg-indigo-50 text-indigo-600",
      accentBar: "bg-indigo-500",
    };
  }
  
  // Default fallback
  return {
    tags: ["General", "Review"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    iconBg: "bg-slate-50 text-slate-600",
    accentBar: "bg-slate-400",
  };
}

export default function QuestionBanksPage() {
  const { banks, isLoading, error, fetchBanks, createBank } = useQuestionBankStore();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBanks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createBank({ name: name.trim(), description: description.trim() || undefined });
      setName("");
      setDescription("");
      setShowCreate(false);
    } catch {
      // error surfaced via store
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-2">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-on-surface">
            Question Banks
          </h1>
          <p className="text-sm text-slate-500">
            Reference checklists you can pull from while reviewing. Only you can see these.
          </p>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-surface transition-all hover:shadow-raised hover:opacity-95 cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Bank
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-8 rounded-xl border border-slate-100 bg-surface-card p-6 shadow-surface"
        >
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-semibold text-on-surface">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. React Fundamentals, System Design: DBs"
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:bg-surface-card focus:ring-4 focus:ring-secondary"
            />
          </div>
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-semibold text-on-surface">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this bank covers"
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:bg-surface-card focus:ring-4 focus:ring-secondary"
            />
          </div>
          {error && <p className="mb-4 text-sm text-error font-medium">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-surface disabled:opacity-60 cursor-pointer"
            >
              {submitting ? "Creating…" : "Create Bank"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-surface-hover cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading && banks.length === 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse rounded-xl border border-slate-100 bg-surface-card p-6 h-[190px]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {banks.map((bank) => {
            const { tags, icon, iconBg, accentBar } = getBankMetadata(bank.name);
            return (
              <Link
                key={bank.id}
                href={`/dashboard/question-banks/${bank.id}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-100 bg-surface-card p-6 shadow-surface transition-all hover:-translate-y-0.5 hover:border-primary/15 hover:shadow-raised"
              >
                {/* Accent line on left edge */}
                <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${accentBar}`} />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
                      {icon}
                    </div>
                  </div>
                  <h3 className="mb-1.5 text-base font-bold text-slate-900 group-hover:text-primary transition-colors">
                    {bank.name}
                  </h3>
                  <p className="line-clamp-2 text-sm text-slate-500 leading-relaxed">
                    {bank.description || "No description provided."}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100/60 pt-4">
                  <div className="flex gap-1.5 flex-wrap">
                    {tags.map((tag) => (
                      <span key={tag} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                    <span>{bank.questionCount !== undefined ? bank.questionCount : 0} Qs</span>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Dotted create new bank card */}
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="flex min-h-[190px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-surface-card p-6 text-center transition-all hover:border-primary/30 hover:bg-slate-50/50 cursor-pointer"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-600">Create new bank</span>
          </button>
        </div>
      )}
    </div>
  );
}