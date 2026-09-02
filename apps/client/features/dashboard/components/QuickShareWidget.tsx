"use client";

import React, { useState } from "react";
import type { QuickShareEventType } from "../type";

interface QuickShareWidgetProps {
  eventTypes: QuickShareEventType[];
  username?: string;
}

export const QuickShareWidget: React.FC<QuickShareWidgetProps> = ({
  eventTypes,
}) => {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = (id: number, url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-surface-card p-6 shadow-surface">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-on-surface">Quick Share Event Types</h3>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Options"
          >
            •••
          </button>
        </div>

        {eventTypes.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No active event types created yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {eventTypes.map((item) => {
              const isCopied = copiedId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => handleCopy(item.id, item.bookingUrl)}
                  className="group flex cursor-pointer items-center justify-between rounded-xl border border-slate-200/80 bg-surface p-3.5 transition-all hover:border-slate-300 hover:bg-surface-card hover:shadow-2xs"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                      {item.name}
                    </span>
                    <span className="mt-0.5 text-[11px] text-slate-400">
                      {item.bookingUrl}
                    </span>
                  </div>

                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-card text-slate-400 group-hover:bg-secondary group-hover:text-primary transition-colors">
                    {isCopied ? (
                      <span className="text-[10px] font-bold text-emerald-600">✓</span>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
