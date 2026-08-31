"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuestionBankStore } from "@/features/questionBanks/store/questionBankStore";

// Helper to determine icon, tags, and styling based on bank name/details
function getBankMetadata(name: string) {
  const norm = name.toLowerCase();
  
  // Custom document icon for all cards as shown in the mockup
  const icon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );

  let tags = ["General"];
  if (norm.includes("frontend") || norm.includes("fundamentals")) {
    tags = ["General", "Review"];
  } else if (norm.includes("system design") || norm.includes("architecture") || norm.includes("basics")) {
    tags = ["Technical", "Backend"];
  } else if (norm.includes("code quality") || norm.includes("checklist")) {
    tags = ["Review", "Technical"];
  } else if (norm.includes("behavioral")) {
    tags = ["General"];
  } else if (norm.includes("api design") || norm.includes("api")) {
    tags = ["Backend", "Technical"];
  } else if (norm.includes("security") || norm.includes("essentials")) {
    tags = ["Technical", "Security"];
  } else {
    if (norm.includes("technical")) tags = ["Technical"];
    if (norm.includes("backend")) tags = ["Backend"];
    if (norm.includes("review")) tags = ["Review"];
  }

  return {
    tags,
    icon,
  };
}

export default function QuestionBanksPage() {
  const { banks, isLoading, error, fetchBanks, createBank } = useQuestionBankStore();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tagMenuOpen, setTagMenuOpen] = useState(false);

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

  // Process and compute stats
  const totalBanks = banks.length;
  const totalQuestions = banks.reduce((acc, b) => acc + (b.questionCount ?? 0), 0);
  
  let mostUsedBank = "None";
  if (banks.length > 0) {
    const sorted = [...banks].sort((a, b) => (b.questionCount ?? 0) - (a.questionCount ?? 0));
    mostUsedBank = sorted[0]?.name ?? "None";
  }

  // Pre-process banks with metadata
  const processedBanks = banks.map((bank) => {
    const metadata = getBankMetadata(bank.name);
    return { ...bank, metadata };
  });

  // Extract all unique tags
  const allTags = Array.from(
    new Set(processedBanks.flatMap((b) => b.metadata.tags))
  );

  // Filtered Banks
  const filteredBanks = processedBanks.filter((bank) => {
    const matchesSearch =
      bank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bank.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = selectedTag ? bank.metadata.tags.includes(selectedTag) : true;

    return matchesSearch && matchesTag;
  });

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col overflow-hidden max-w-6xl mx-auto py-2">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between shrink-0">
        <div>
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
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

      {/* Inline Create Form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-5 rounded-xl border border-slate-100 bg-surface-card p-5 shadow-surface shrink-0"
        >
          <div className="mb-3.5">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. React Fundamentals, System Design: DBs"
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm outline-none transition-all focus:border-primary focus:bg-surface-card focus:ring-4 focus:ring-secondary/60"
            />
          </div>
          <div className="mb-3.5">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Description <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this bank covers"
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm outline-none transition-all focus:border-primary focus:bg-surface-card focus:ring-4 focus:ring-secondary/60"
            />
          </div>
          {error && <p className="mb-3.5 text-xs text-error font-semibold">{error}</p>}
          <div className="flex gap-2.5">
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary shadow-surface disabled:opacity-60 cursor-pointer"
            >
              {submitting ? "Creating…" : "Create Bank"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-surface-hover cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Summary Cards Row */}
      <div className="mb-5 grid grid-cols-3 gap-5 shrink-0">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-surface flex flex-col justify-center h-24">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Total Banks
          </span>
          <span className="text-3xl font-black text-on-surface leading-none">
            {totalBanks}
          </span>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-surface flex flex-col justify-center h-24">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Total Questions
          </span>
          <span className="text-3xl font-black text-on-surface leading-none">
            {totalQuestions}
          </span>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-surface flex flex-col justify-center h-24">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Most Used Bank
          </span>
          <span className="text-sm font-bold text-on-surface line-clamp-2 leading-tight">
            {mostUsedBank}
          </span>
        </div>
      </div>

      {/* Search and Filter Row */}
      <div className="mb-5 flex gap-3 items-center shrink-0">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search question banks..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-secondary/60 bg-white transition-all"
          />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setTagMenuOpen(!tagMenuOpen)}
            className="flex items-center gap-1.5 border border-slate-200 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-500 hover:bg-surface-hover hover:text-on-surface cursor-pointer shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span>{selectedTag ? `Tag: ${selectedTag}` : "Filter by Tag"}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-65 ml-0.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {tagMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setTagMenuOpen(false)} />
              <div className="absolute right-0 top-11 z-20 w-48 rounded-xl border border-slate-100 bg-white py-1 shadow-raised">
                <button
                  onClick={() => {
                    setSelectedTag(null);
                    setTagMenuOpen(false);
                  }}
                  className="flex w-full items-center px-4 py-2 text-left text-xs font-medium text-slate-600 hover:bg-surface-hover"
                >
                  All Tags
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTag(tag);
                      setTagMenuOpen(false);
                    }}
                    className={`flex w-full items-center px-4 py-2 text-left text-xs font-medium hover:bg-surface-hover ${
                      selectedTag === tag ? "text-primary font-bold" : "text-slate-600"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grid List Container (Scrollable) */}
      <div className="flex-1 overflow-y-auto pr-1">
        {isLoading && banks.length === 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="animate-pulse rounded-xl border border-slate-100 bg-surface-card p-5 h-[175px]" />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 pb-4">
            {filteredBanks.map((bank) => {
              return (
                <Link
                  key={bank.id}
                  href={`/dashboard/question-banks/${bank.id}`}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-100 bg-surface-card p-5 shadow-surface transition-all hover:border-primary/15 hover:shadow-raised hover:-translate-y-[1px]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 text-primary">
                        {bank.metadata.icon}
                      </div>
                      <div className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-primary">
                        {bank.questionCount !== undefined ? bank.questionCount : 0} Qs
                      </div>
                    </div>
                    
                    <h3 className="mb-1 text-sm font-bold text-on-surface group-hover:text-primary transition-colors leading-tight">
                      {bank.name}
                    </h3>
                    <p className="line-clamp-2 text-xs text-slate-400 leading-relaxed">
                      {bank.description || "No description provided."}
                    </p>
                  </div>

                  <div className="mt-5 flex gap-1.5 flex-wrap">
                    {bank.metadata.tags.map((tag) => (
                      <span key={tag} className="rounded-md bg-slate-100/85 border border-slate-200/20 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}

            {/* Dotted create new bank card */}
            <button
              onClick={() => setShowCreate((v) => !v)}
              className="flex min-h-[162px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-surface-card p-5 text-center transition-all hover:border-primary/30 hover:bg-slate-50/50 cursor-pointer"
            >
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-slate-500">Create new bank</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}