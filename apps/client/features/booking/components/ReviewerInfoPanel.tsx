import type { BookingPageInfo } from "../type";
import { getInitials } from "../utils";

type ReviewerInfoPanelProps = {
  pageInfo: BookingPageInfo;
};

export default function ReviewerInfoPanel({ pageInfo }: ReviewerInfoPanelProps) {
  const initials = getInitials(pageInfo.reviewer.name);

  return (
    <div className="border-b border-slate-200 p-8 md:border-b-0">
      {pageInfo.reviewer.avatarUrl ? (
        <img
          src={pageInfo.reviewer.avatarUrl}
          alt={pageInfo.reviewer.name}
          className="h-14 w-14 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-base font-semibold text-white">
          {initials}
        </div>
      )}

      <p className="mt-4 text-sm text-slate-500">{pageInfo.reviewer.name}</p>
      <h1 className="mt-1 text-xl font-semibold leading-snug tracking-tight text-on-surface">
        {pageInfo.eventType.name}
      </h1>

      {pageInfo.eventType.description && (
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {pageInfo.eventType.description}
        </p>
      )}

      {pageInfo.reviewer.bio && (
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          {pageInfo.reviewer.bio}
        </p>
      )}

      <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
        <div className="flex items-center gap-2.5 text-sm text-slate-600">
          <svg
            className="h-4 w-4 shrink-0 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6l4 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {pageInfo.eventType.durationMinutes} min
        </div>
        <div className="flex items-center gap-2.5 text-sm text-slate-600">
          <svg
            className="h-4 w-4 shrink-0 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9 4.5 4.03 4.5 9-2.015 9-4.5 9zM3.5 12h17"
            />
          </svg>
          {pageInfo.eventType.timezone}
        </div>
      </div>
    </div>
  );
}