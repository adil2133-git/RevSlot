"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

import { useAuthStore } from "@/features/auth/store/authStore";
import GoogleCalendarCard from "@/features/calendar/components/GoogleCalendarCard";
import ProfileInfoCard from "@/features/auth/components/ProfileInfoCard";
import { ApiError } from "@/lib/axios";

type Tab = "profile" | "calendar" | "account";

const TABS: { id: Tab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "calendar", label: "Calendar" },
  { id: "account", label: "Account" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, changePassword } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  // ---- Account tab (email/username + password) ----
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmitPassword =
    currentPassword.length > 0 && newPassword.length >= 8 && !passwordMismatch && !passwordSaving;

  const handlePasswordChange = async () => {
    if (!canSubmitPassword) return;

    setPasswordSaving(true);
    setPasswordError(null);
    try {
      await changePassword({ currentPassword, newPassword });
      // Backend revoked every session on success — mirror that by
      // sending the user back to login, same as a normal logout.
      router.push("/login/reviewer");
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="container-page max-w-4xl py-10">
        <p className="text-slate-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="container-page max-w-4xl py-10">
      <h1 className="text-3xl font-bold text-on-surface">Settings</h1>
      <p className="mt-1 text-slate-400">Manage your profile, calendar, and account security.</p>

      {/* Tab bar */}
      <div className="mt-6 flex gap-1 border-b border-slate-100">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-primary"
                : "text-slate-400 hover:text-on-surface"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>

            {activeTab === "profile" && (
     <div className="mt-6">
         <ProfileInfoCard />
     </div>
      )}

      {/* ---- Calendar tab ---- */}
      {activeTab === "calendar" && (
        <div className="mt-6">
          <GoogleCalendarCard />
        </div>
      )}

      {/* ---- Account tab (info + password/security) ---- */}
      {activeTab === "account" && (
        <div className="mt-6 space-y-6">
          <div className="rounded-xl border border-slate-100 bg-surface-card p-6 shadow-surface">
            <h2 className="mb-4 text-base font-semibold text-on-surface">Account</h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Email</span>
                <span className="flex items-center gap-2 font-medium text-on-surface">
                  {user.email}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      user.emailVerified
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {user.emailVerified ? "Verified" : "Unverified"}
                  </span>
                </span>
              </div>

              {user.username && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Username</span>
                  <span className="font-medium text-on-surface">@{user.username}</span>
                </div>
              )}

              {user.username && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Public booking link</span>
                  <a
                    href={`/${user.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    revslot.com/{user.username}
                  </a>
                </div>
              )}

              {user.createdAt && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Member since</span>
                  <span className="font-medium text-on-surface">
                    {dayjs(user.createdAt).format("MMM D, YYYY")}
                  </span>
                </div>
              )}
            </div>
          </div>

           {/* Password & Security */}
{user.hasPassword && (
  <div className="rounded-xl border border-slate-100 bg-surface-card p-6 shadow-surface">
    <div className="mb-6">
      <h2 className="text-base font-semibold text-on-surface">
        Password & Security
      </h2>

      <p className="mt-1 text-sm text-slate-400">
        Update your password to keep your account secure. You&apos;ll be
        signed out of all devices after changing it.
      </p>
    </div>

    <div className="max-w-xl space-y-5">
      {/* Current Password */}
      <div>
        <label
          htmlFor="currentPassword"
          className="mb-2 block text-sm font-semibold text-on-surface"
        >
          Current password
        </label>

        <div className="relative">
          <input
            id="currentPassword"
            type={showCurrentPassword ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter your current password"
            className="w-full rounded-lg border border-slate-300 p-2.5 pr-16 text-sm text-on-surface focus:border-primary focus:outline-none"
          />

          <button
            type="button"
            onClick={() =>
              setShowCurrentPassword((prev) => !prev)
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-on-surface"
          >
            {showCurrentPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {/* New Password */}
      <div>
        <label
          htmlFor="newPassword"
          className="mb-2 block text-sm font-semibold text-on-surface"
        >
          New password
        </label>

        <div className="relative">
          <input
            id="newPassword"
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter your new password"
            className="w-full rounded-lg border border-slate-300 p-2.5 pr-16 text-sm text-on-surface focus:border-primary focus:outline-none"
          />

          <button
            type="button"
            onClick={() =>
              setShowNewPassword((prev) => !prev)
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-on-surface"
          >
            {showNewPassword ? "Hide" : "Show"}
          </button>
        </div>

        <p className="mt-1.5 text-xs text-slate-400">
          Use at least 8 characters.
        </p>
      </div>

      {/* Confirm Password */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-2 block text-sm font-semibold text-on-surface"
        >
          Confirm new password
        </label>

        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
            className="w-full rounded-lg border border-slate-300 p-2.5 pr-16 text-sm text-on-surface focus:border-primary focus:outline-none"
          />

          <button
            type="button"
            onClick={() =>
              setShowConfirmPassword((prev) => !prev)
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-on-surface"
          >
            {showConfirmPassword ? "Hide" : "Show"}
          </button>
        </div>

        {passwordMismatch && (
          <p className="mt-1.5 text-xs text-error">
            Passwords don&apos;t match.
          </p>
        )}
      </div>

      {/* Error */}
      {passwordError && (
        <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-error">
          {passwordError}
        </div>
      )}

      {/* Submit */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handlePasswordChange}
          disabled={!canSubmitPassword}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {passwordSaving ? "Changing…" : "Change password"}
        </button>
      </div>
    </div>
  </div>
)}
</div>
)}
</div>
);
}