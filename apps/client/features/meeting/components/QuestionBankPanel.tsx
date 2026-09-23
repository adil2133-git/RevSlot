"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ChevronLeft,
  ListChecks,
  Send,
  X,
} from "lucide-react";

import { useQuestionBankStore } from "@/features/questionBanks/store/questionBankStore";

type QuestionBankPanelProps = {
  onClose: () => void;
  onAskInChat: (questionText: string) => void;
};

export default function QuestionBankPanel({
  onClose,
  onAskInChat,
}: QuestionBankPanelProps) {
  const {
    banks,
    selectedBank,
    isLoading,
    error,
    fetchBanks,
    fetchBank,
    clearSelectedBank,
  } = useQuestionBankStore();

  const [sentId, setSentId] = useState<number | null>(null);

  useEffect(() => {
    void fetchBanks();

    return () => {
      clearSelectedBank();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAsk = (id: number, text: string) => {
    onAskInChat(text);

    setSentId(id);

    window.setTimeout(() => {
      setSentId((current) => (current === id ? null : current));
    }, 1500);
  };

  return (
    <aside className="flex h-[360px] w-full flex-col rounded-2xl bg-white text-slate-900 lg:h-auto lg:w-80">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2 font-semibold">
          {selectedBank && (
            <button
              type="button"
              onClick={clearSelectedBank}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              title="Back to question banks"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          <ListChecks size={17} />

          {selectedBank ? selectedBank.name : "Question banks"}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-primary" />
            <span className="mt-3 text-xs text-slate-500">Loading…</span>
          </div>
        )}

        {!isLoading && error && (
          <p className="py-8 text-center text-xs text-red-500">{error}</p>
        )}

        {!isLoading && !error && !selectedBank && (
          <>
            {banks.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                You haven&apos;t created any question banks yet.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {banks.map((bank) => (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => void fetchBank(bank.id)}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:border-primary hover:bg-secondary/30"
                  >
                    <span>{bank.name}</span>

                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                      {bank.questionCount ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {!isLoading && !error && selectedBank && (
          <>
            {selectedBank.questions.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                This question bank has no questions yet.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {[...selectedBank.questions]
                  .sort(
                    (a, b) =>
                      (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
                  )
                  .map((q) => (
                    <div
                      key={q.id}
                      className="rounded-xl border border-slate-200 p-3"
                    >
                      <p className="text-sm font-semibold text-slate-800">
                        {q.questionText}
                      </p>

                      {q.description && (
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                          {q.description}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          handleAsk(q.id, q.questionText)
                        }
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-on-primary hover:opacity-90"
                      >
                        <Send size={12} />
                        {sentId === q.id ? "Sent!" : "Ask in chat"}
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}