import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-4 pt-6">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeftIcon />
        Previous
      </button>

      <div className="flex gap-2">
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition ${
              p === page
                ? "bg-primary text-on-primary"
                : "text-on-surface hover:bg-surface-hover"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
        <ChevronRightIcon />
      </button>
    </div>
  );
}