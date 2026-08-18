"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuestionBankStore } from "@/features/questionBanks/store/questionBankStore";

export default function QuestionBankDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bankId = Number(params.bankId);

  const {
    selectedBank,
    isLoading,
    error,
    fetchBank,
    updateBank,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    moveQuestion,
    deleteBank,
    clearSelectedBank,
  } = useQuestionBankStore();

  const [newQuestion, setNewQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Question editing states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  // Bank editing states
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [editBankName, setEditBankName] = useState("");
  const [editBankDesc, setEditBankDesc] = useState("");
  const [savingBank, setSavingBank] = useState(false);

  useEffect(() => {
    fetchBank(bankId);
    return () => clearSelectedBank();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankId]);

  // Populate bank edit form when selectedBank is loaded
  useEffect(() => {
    if (selectedBank) {
      setEditBankName(selectedBank.name);
      setEditBankDesc(selectedBank.description || "");
    }
  }, [selectedBank]);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    setSubmitting(true);
    try {
      await addQuestion(bankId, { questionText: newQuestion.trim() });
      setNewQuestion("");
    } catch {
      // error surfaced via store
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (id: number, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const saveEdit = async (id: number) => {
    if (!editText.trim()) return;
    await updateQuestion(bankId, id, { questionText: editText.trim() });
    setEditingId(null);
  };

  const handleUpdateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBankName.trim()) return;
    setSavingBank(true);
    try {
      await updateBank(bankId, {
        name: editBankName.trim(),
        description: editBankDesc.trim() || undefined,
      });
      setIsEditingBank(false);
    } catch {
      // error surfaced via store
    } finally {
      setSavingBank(false);
    }
  };

  const handleDeleteBank = async () => {
    if (!confirm(`Delete "${selectedBank?.name}"? This removes all its questions too.`)) return;
    await deleteBank(bankId);
    router.push("/dashboard/question-banks");
  };

  if (isLoading && !selectedBank) {
    return (
      <div className="max-w-4xl mx-auto py-4">
        <p className="text-sm text-slate-500 animate-pulse">Loading bank details…</p>
      </div>
    );
  }

  if (!selectedBank) {
    return (
      <div className="max-w-4xl mx-auto py-4">
        <p className="text-sm text-error font-semibold">{error || "Bank not found."}</p>
        <Link href="/dashboard/question-banks" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
          ← Back to question banks
        </Link>
      </div>
    );
  }

  const sortedQuestions = [...selectedBank.questions].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
  );

  return (
    <div className="max-w-4xl mx-auto py-2">
      {/* Top breadcrumb & action header */}
      <div className="mb-4 flex items-center justify-between text-sm">
        <Link
          href="/dashboard/question-banks"
          className="inline-flex items-center gap-1.5 font-semibold text-slate-500 hover:text-primary transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Question Banks
        </Link>

        <div className="flex items-center gap-4">
          {!isEditingBank && (
            <button
              onClick={() => setIsEditingBank(true)}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-primary font-semibold transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
              </svg>
              Edit Bank Details
            </button>
          )}
          <button
            onClick={handleDeleteBank}
            className="font-semibold text-error hover:opacity-90 transition-colors cursor-pointer"
          >
            Delete bank
          </button>
        </div>
      </div>

      {/* Bank Header Section */}
      {isEditingBank ? (
        <form onSubmit={handleUpdateBank} className="mb-8 rounded-xl border border-slate-100 bg-surface-card p-6 shadow-surface">
          <h2 className="text-base font-bold text-slate-900 mb-4">Edit Bank Details</h2>
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-400">Name</label>
            <input
              value={editBankName}
              onChange={(e) => setEditBankName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2 text-sm outline-none transition-all focus:border-primary focus:bg-surface-card focus:ring-4 focus:ring-secondary"
            />
          </div>
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-400">Description</label>
            <input
              value={editBankDesc}
              onChange={(e) => setEditBankDesc(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2 text-sm outline-none transition-all focus:border-primary focus:bg-surface-card focus:ring-4 focus:ring-secondary"
            />
          </div>
          <div className="flex gap-2.5">
            <button
              type="submit"
              disabled={savingBank || !editBankName.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-surface disabled:opacity-60 cursor-pointer"
            >
              {savingBank ? "Saving…" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditingBank(false);
                setEditBankName(selectedBank.name);
                setEditBankDesc(selectedBank.description || "");
              }}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-surface-hover cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
            {selectedBank.name}
          </h1>
          <p className="text-sm text-slate-500">
            {selectedBank.description || "Manage and organize technical questions for candidates."}
          </p>
        </div>
      )}

      {/* Add New Question Input Form */}
      <form onSubmit={handleAddQuestion} className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <input
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Type a new question here and press Enter to add..."
            className="w-full rounded-lg border border-slate-200 bg-surface-card pl-11 pr-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-secondary shadow-surface"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !newQuestion.trim()}
          className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-surface hover:opacity-95 disabled:opacity-60 cursor-pointer transition-all shrink-0"
        >
          Add Question
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-error font-semibold">{error}</p>}

      {/* List / Empty State */}
      {sortedQuestions.length === 0 ? (
        <div className="rounded-xl border border-slate-100 bg-surface-card px-6 py-16 text-center shadow-surface mt-4">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="9" x2="15" y2="9" />
              <line x1="9" y1="13" x2="15" y2="13" />
              <line x1="9" y1="17" x2="13" y2="17" />
            </svg>
          </div>
          <h3 className="mb-2 text-base font-bold text-slate-900">No questions in this bank yet</h3>
          <p className="mx-auto max-w-md text-sm text-slate-500 leading-relaxed">
            Start building your checklist by adding your first question using the input field above. 
            Questions added here can be quickly inserted into your upcoming {selectedBank.name} interview sessions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <ul className="space-y-3">
            {sortedQuestions.map((q, i) => {
              const numStr = String(i + 1).padStart(2, "0");
              return (
                <li
                  key={q.id}
                  className="group flex items-center justify-between rounded-xl border border-slate-100 bg-surface-card px-5 py-4.5 shadow-surface transition-all hover:border-primary/10"
                >
                  <div className="flex flex-1 items-center gap-3.5 min-w-0">
                    {/* Drag dots + Question number */}
                    <div className="flex items-center gap-1.5 shrink-0 select-none">
                      <svg width="12" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-300">
                        <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
                        <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                        <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
                      </svg>
                      <span className="text-xs font-bold text-primary/70 bg-secondary/80 px-1.5 py-0.5 rounded">
                        {numStr}
                      </span>
                    </div>

                    {editingId === q.id ? (
                      <div className="flex flex-1 items-center gap-3">
                        <input
                          autoFocus
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit(q.id)}
                          className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-secondary bg-slate-50/50"
                        />
                        <button onClick={() => saveEdit(q.id)} className="text-xs font-bold text-primary cursor-pointer">
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-xs font-bold text-slate-400 cursor-pointer">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-slate-700 leading-relaxed truncate group-hover:text-clip group-hover:whitespace-normal">
                        {q.questionText}
                      </p>
                    )}
                  </div>

                  {/* Action items on hover or default */}
                  {editingId !== q.id && (
                    <div className="ml-4 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                      {/* Move Question Up */}
                      <button
                        onClick={() => moveQuestion(bankId, q.id, "up")}
                        disabled={i === 0}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m18 15-6-6-6 6" /></svg>
                      </button>
                      
                      {/* Move Question Down */}
                      <button
                        onClick={() => moveQuestion(bankId, q.id, "down")}
                        disabled={i === sortedQuestions.length - 1}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
                      </button>

                      {/* Edit Question */}
                      <button
                        onClick={() => startEdit(q.id, q.questionText)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-50 hover:text-primary cursor-pointer"
                        title="Edit Question"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>
                      </button>

                      {/* Delete Question */}
                      <button
                        onClick={() => deleteQuestion(bankId, q.id)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-error-container hover:text-error cursor-pointer"
                        title="Delete Question"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" /></svg>
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="pt-2 text-center text-xs font-semibold text-slate-400 select-none">
            {sortedQuestions.length} {sortedQuestions.length === 1 ? "question" : "questions"} in this bank
          </div>
        </div>
      )}
    </div>
  );
}