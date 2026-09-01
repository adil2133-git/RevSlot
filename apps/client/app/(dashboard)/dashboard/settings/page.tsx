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

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, updateProfile, changePassword } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  // ---- Profile tab ----
  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [whatsappNumber, setWhatsappNumber] = useState(user?.whatsappNumber ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  const profileDirty =
    name !== (user?.name ?? "") ||
    bio !== (user?.bio ?? "") ||
    whatsappNumber !== (user?.whatsappNumber ?? "");

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileError(null);
    setProfileSaved(false);
    try {
      await updateProfile({ name, bio, whatsappNumber });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setProfileSaving(false);
    }
  };

  // ---- Account tab (email/username + password) ----
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

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

          {/* Password — Google-only accounts (no passwordHash) never see this */}
          {user.hasPassword && (
            <div className="rounded-xl border border-slate-100 bg-surface-card p-6 shadow-surface">
              <h2 className="mb-1 text-base font-semibold text-on-surface">Password</h2>
              <p className="mb-4 text-sm text-slate-400">
                Changing your password logs you out of every device — you&apos;ll need to log back in.
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="mb-2 block text-sm font-semibold text-on-surface">
                    Current password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="mb-2 block text-sm font-semibold text-on-surface">
                    New password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-on-surface">
                    Confirm new password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
                  />
                  {passwordMismatch && (
                    <p className="mt-1 text-xs text-error">Passwords don&apos;t match.</p>
                  )}
                </div>

                {passwordError && <p className="text-sm text-error">{passwordError}</p>}

                <button
                  onClick={handlePasswordChange}
                  disabled={!canSubmitPassword}
                  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {passwordSaving ? "Changing…" : "Change password"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}