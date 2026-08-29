"use client";

import Link from "next/link";
import { Suspense } from "react";
import GoogleCalendarCard from "@/features/calendar/components/GoogleCalendarCard";
import { useAuthStore } from "@/features/auth/store/authStore";

const QUICK_LINKS = [
  {
    href: "/availability",
    title: "Set your availability",
    desc: "Build a reusable weekly template with your open time blocks.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M3 9h18" />
        <path d="M8 2v4M16 2v4" />
      </svg>
    ),
  },
  {
    href: "dashboard/event-types",
    title: "Create a booking link",
    desc: "Turn a template into a shareable link advisors can book directly.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.07 0l2.5-2.5a5 5 0 0 0-7.07-7.07L11 4.93" />
        <path d="M14 11a5 5 0 0 0-7.07 0l-2.5 2.5a5 5 0 0 0 7.07 7.07L13 19.07" />
      </svg>
    ),
  },
  {
    href: "dashboard/vacation",
    title: "Going away?",
    desc: "Block out dates so no one can book you while you're out.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 22h20" />
        <path d="M6.36 17.4 4 17l-2-4 1.44-.72a2 2 0 0 1 2.12.24l1.4 1.12a4 4 0 0 0 2.8 1H12l6.28-6.28a2.17 2.17 0 0 1 3.06 3.07L15 18l-4-2.5" />
        <path d="M9 11.2 8 5l4-1.5" />
      </svg>
    ),
  },
];

export default function DashboardOverviewPage() {
  const user = useAuthStore((state) => state.user);
  const firstName = user?.name?.split(" ")[0];

  return (
    <div>
      <div className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="mb-1.5 text-2xl font-semibold tracking-tight text-on-surface">
            {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
          </h1>
          <p className="text-sm text-slate-600">
            Here&apos;s a quick way into your reviewer workspace.
          </p>
        </div>
        <Link
          href="/dashboard/event-types"
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-surface transition-shadow hover:shadow-raised"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Event Type
        </Link>
      </div>

      <Suspense fallback={null}>
         <GoogleCalendarCard />
      </Suspense>

      <div className="grid gap-5 sm:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group relative overflow-hidden rounded-xl border border-slate-100 bg-surface-card p-6 shadow-surface transition-all hover:-translate-y-0.5 hover:border-primary/15 hover:shadow-raised"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary">
              {link.icon}
            </div>
            <h3 className="mb-2 text-sm font-semibold text-on-surface">{link.title}</h3>
            <p className="mb-4 text-sm leading-relaxed text-slate-600">{link.desc}</p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Go there
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
