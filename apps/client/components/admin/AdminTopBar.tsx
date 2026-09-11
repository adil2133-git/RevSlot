"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useAdminStore } from "@/features/admin/store/adminStore";

export default function AdminTopBar() {
  const { user } = useAuthStore();
  const { profile, fetchProfile } = useAdminStore();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!profile) {
      fetchProfile();
    }
  }, [profile, fetchProfile]);

  const displayName = profile?.name || user?.name || "Administrator";
  const displayRole = user?.role === "admin" ? "Super Administrator" : "Administrator";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-100 bg-white/95 px-8 backdrop-blur-md">
      {/* Global Search Bar */}
      <div className="relative w-full max-w-md">
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search faculty, reviewer, slots..."
          className="w-full rounded-xl border border-slate-200/90 bg-[#f8fafc] py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 transition-all focus:border-[#003366] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#003366]/20"
        />
      </div>

      {/* Right Actions & Profile */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
        </button>

        {/* Settings Gear */}
        <Link
          href="/admin/settings"
          aria-label="Settings"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </Link>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200" />

        {/* Profile Card */}
        <Link
          href="/admin/settings"
          className="flex items-center gap-3 rounded-xl p-1 transition-colors hover:bg-slate-50"
        >
          <div className="text-right">
            <p className="text-xs font-bold leading-tight text-slate-900">{displayName}</p>
            <p className="text-[11px] font-medium text-slate-400">{displayRole}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#001f3f] text-white shadow-xs font-bold text-xs">
            {profile?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={displayName}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}
