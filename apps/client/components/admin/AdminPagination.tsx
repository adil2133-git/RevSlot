"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface AdminPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit?: number;
  onPageChange: (page: number) => void;
  label?: string;
  className?: string;
}

export default function AdminPagination({
  page,
  totalPages,
  total,
  limit = 5,
  onPageChange,
  label = "records",
  className = "",
}: AdminPaginationProps) {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const startRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (safeTotalPages <= 5) {
      for (let i = 1; i <= safeTotalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Always include page 1
    pages.push(1);

    if (page > 3) {
      pages.push("ellipsis");
    }

    // Window around current page
    const start = Math.max(2, page - 1);
    const end = Math.min(safeTotalPages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (page < safeTotalPages - 2) {
      pages.push("ellipsis");
    }

    // Always include last page
    pages.push(safeTotalPages);

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-3.5 sm:flex-row text-xs ${className}`}
    >
      {/* Records count summary */}
      <span className="font-medium text-slate-500">
        Showing <span className="font-bold text-slate-800">{startRecord}</span> to{" "}
        <span className="font-bold text-slate-800">{endRecord}</span> of{" "}
        <span className="font-bold text-slate-800">{total}</span> {label}
      </span>

      {/* Pagination controls */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors cursor-pointer"
          aria-label="Previous Page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {pageNumbers.map((p, idx) => {
          if (p === "ellipsis") {
            return (
              <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 font-semibold select-none">
                …
              </span>
            );
          }

          const isActive = p === page;

          return (
            <button
              key={`page-${p}`}
              type="button"
              onClick={() => onPageChange(p)}
              className={`h-8 min-w-[32px] rounded-lg px-2 text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                isActive
                  ? "bg-[#002b49] text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeTotalPages, page + 1))}
          disabled={page >= safeTotalPages}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors cursor-pointer"
          aria-label="Next Page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
