"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useReviewerProfile } from "@/features/booking/hooks/useReviewerProfile";
import PoweredByFooter from "@/features/booking/components/PoweredByFooter";

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

const RupeeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a5 5 0 0 0 0-10" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default function ReviewerProfilePage() {
  const params = useParams<{ username: string }>();
  const { profile, profileError, profileLoading } = useReviewerProfile(params.username);

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <p className="text-sm text-slate-400">Loading profile…</p>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-base font-semibold text-on-surface">This profile isn&apos;t available</h1>
          <p className="mt-1 text-sm text-slate-500">
            {profileError ?? "Double-check the link and try again."}
          </p>
        </div>
      </div>
    );
  }

  const { reviewer, eventTypes } = profile;
  const initials = reviewer.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-surface px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          {reviewer.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={reviewer.avatarUrl}
              alt={reviewer.name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-lg font-semibold text-on-primary">
              {initials}
            </div>
          )}
          <h1 className="mt-4 text-xl font-semibold text-on-surface">{reviewer.name}</h1>
          {reviewer.bio && <p className="mt-1 max-w-md text-sm text-slate-500">{reviewer.bio}</p>}
        </div>

        {eventTypes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-surface-card p-10 text-center text-sm text-slate-500">
            No bookable sessions available right now.
          </div>
        ) : (
          <div className="space-y-3">
            {eventTypes.map((eventType) => (
              <Link
                key={eventType.id}
                href={`/${params.username}/${eventType.slug}`}
                className="group flex items-center justify-between rounded-xl border border-slate-200 bg-surface-card p-5 shadow-surface transition-colors hover:border-primary"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface group-hover:text-primary">
                    {eventType.name}
                  </p>
                  {eventType.description && (
                    <p className="mt-0.5 truncate text-xs text-slate-500">{eventType.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <ClockIcon />
                      {eventType.durationMinutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <RupeeIcon />
                      {eventType.price > 0 ? `₹${eventType.price}` : "Free"}
                    </span>
                  </div>
                </div>
                <span className="shrink-0 text-slate-300 group-hover:text-primary">
                  <ArrowIcon />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
      <PoweredByFooter />
    </div>
  );
}