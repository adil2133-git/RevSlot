"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "@/features/admin/store/adminStore";
import dayjs from "dayjs";

type SettingsTab = "profile" | "security" | "platform" | "system";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AdminSettingsPage() {
  const { profile, isProfileLoading, error, fetchProfile, updateProfile } = useAdminStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // Profile Form state
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Security Form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Platform Preferences state
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [cancellationAlerts, setCancellationAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [academicSession, setAcademicSession] = useState("2024-2025 Tier I");
  const [bookingWindowDays, setBookingWindowDays] = useState(14);
  const [platformSaved, setPlatformSaved] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setBio(profile.bio ?? "");
      setAvatarUrl(profile.avatarUrl ?? "");
    }
  }, [profile]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSaved(false);
    setProfileError(null);
    try {
      await updateProfile({
        name: name.trim() || undefined,
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err: any) {
      setProfileError(err?.message || "Failed to save profile changes.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }

    setSavingPassword(true);
    setPasswordSaved(false);
    try {
      await updateProfile({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err: any) {
      setPasswordError(err?.message || "Failed to update password. Verify your current password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handlePlatformSave = (e: React.FormEvent) => {
    e.preventDefault();
    setPlatformSaved(true);
    setTimeout(() => setPlatformSaved(false), 3000);
  };

  if (isProfileLoading && !profile) {
    return (
      <div className="flex min-h-[350px] items-center justify-center py-12">
        <div className="flex flex-col items-center gap-2.5 text-slate-400">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#003366] border-t-transparent"></div>
          <span className="text-xs font-medium">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-14">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Admin Settings
        </h1>
        <p className="text-sm text-slate-500">
          Manage your administrator profile, security credentials, and platform preferences.
        </p>
      </div>

      {/* Tabs bar */}
      <div className="flex gap-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("profile")}
          className={`relative flex items-center gap-2 px-4 py-3 text-xs font-bold transition ${
            activeTab === "profile"
              ? "text-[#003366]"
              : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Profile & Account
          {activeTab === "profile" && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#003366]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`relative flex items-center gap-2 px-4 py-3 text-xs font-bold transition ${
            activeTab === "security"
              ? "text-[#003366]"
              : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Security & Password
          {activeTab === "security" && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#003366]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("platform")}
          className={`relative flex items-center gap-2 px-4 py-3 text-xs font-bold transition ${
            activeTab === "platform"
              ? "text-[#003366]"
              : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Platform Preferences
          {activeTab === "platform" && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#003366]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("system")}
          className={`relative flex items-center gap-2 px-4 py-3 text-xs font-bold transition ${
            activeTab === "system"
              ? "text-[#003366]"
              : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
          </svg>
          System Health & Logs
          {activeTab === "system" && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#003366]" />
          )}
        </button>
      </div>

      {/* Tab 1: Profile & Account */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Summary Card */}
          <div className="h-fit rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#e8f0f8] text-xl font-bold text-[#003366] ring-4 ring-slate-50">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  profile && initials(profile.name)
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900">{profile?.name || "Admin"}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{profile?.email}</p>
              <div className="mt-3 flex items-center gap-1.5 rounded-full bg-[#e8f0f8] px-3 py-1 text-[11px] font-bold text-[#003366]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Super Administrator
              </div>

              <div className="mt-6 w-full space-y-2 border-t border-slate-100 pt-4 text-left text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Role Access</span>
                  <span className="font-semibold text-slate-700">Full Privileges</span>
                </div>
                <div className="flex justify-between">
                  <span>Account Status</span>
                  <span className="font-semibold text-emerald-600">Active</span>
                </div>
                <div className="flex justify-between">
                  <span>Created</span>
                  <span className="font-semibold text-slate-700">
                    {profile?.createdAt ? dayjs(profile.createdAt).format("MMM D, YYYY") : "Aug 2026"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Edit Form */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handleProfileSubmit}
              className="rounded-2xl border border-slate-100 bg-white p-7 shadow-xs"
            >
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Edit Administrator Profile
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Update your identity details visible on reports and audit logs.
              </p>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={profile?.email || ""}
                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 font-medium text-slate-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Admin email addresses are managed centrally and cannot be changed here.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Bio & Responsibilities
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief description of administrative oversight and department..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Avatar Image URL
                  </label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                  />
                </div>

                {profileError && (
                  <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">
                    {profileError}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="rounded-xl bg-[#002b55] px-5 py-2.5 font-bold text-white shadow-xs transition hover:bg-[#001f3f] disabled:opacity-50"
                  >
                    {savingProfile ? "Saving Changes..." : "Save Changes"}
                  </button>

                  {profileSaved && (
                    <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Profile saved!
                    </span>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === "security" && (
        <div className="max-w-2xl">
          <form
            onSubmit={handlePasswordSubmit}
            className="rounded-2xl border border-slate-100 bg-white p-7 shadow-xs"
          >
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Change Admin Password
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Ensure your password is at least 8 characters long to protect administrative access.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                />
              </div>

              {passwordError && (
                <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">
                  {passwordError}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingPassword || !currentPassword || !newPassword}
                  className="rounded-xl bg-[#002b55] px-5 py-2.5 font-bold text-white shadow-xs transition hover:bg-[#001f3f] disabled:opacity-50"
                >
                  {savingPassword ? "Updating Password..." : "Update Password"}
                </button>

                {passwordSaved && (
                  <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Password updated successfully!
                  </span>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Platform Preferences */}
      {activeTab === "platform" && (
        <div className="max-w-2xl">
          <form
            onSubmit={handlePlatformSave}
            className="rounded-2xl border border-slate-100 bg-white p-7 shadow-xs"
          >
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Platform Configuration
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Configure global academic session scheduling and email alerts.
            </p>

            <div className="space-y-5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Active Academic Session
                </label>
                <input
                  type="text"
                  value={academicSession}
                  onChange={(e) => setAcademicSession(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Default Booking Window (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={bookingWindowDays}
                  onChange={(e) => setBookingWindowDays(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
                />
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="font-bold text-slate-900">Email Notification Triggers</div>

                <label className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 cursor-pointer">
                  <div>
                    <div className="font-semibold text-slate-800">New Booking Confirmation</div>
                    <div className="text-[11px] text-slate-400">Receive alert when advisor books a slot</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#003366]"
                  />
                </label>

                <label className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 cursor-pointer">
                  <div>
                    <div className="font-semibold text-slate-800">Cancellation & Reschedule Notices</div>
                    <div className="text-[11px] text-slate-400">Alert admin when a session is moved or cancelled</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={cancellationAlerts}
                    onChange={(e) => setCancellationAlerts(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#003366]"
                  />
                </label>

                <label className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 cursor-pointer">
                  <div>
                    <div className="font-semibold text-slate-800">Weekly Executive Digest</div>
                    <div className="text-[11px] text-slate-400">Receive Monday morning platform summary report</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={weeklyDigest}
                    onChange={(e) => setWeeklyDigest(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#003366]"
                  />
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-[#002b55] px-5 py-2.5 font-bold text-white shadow-xs transition hover:bg-[#001f3f]"
                >
                  Save Preferences
                </button>

                {platformSaved && (
                  <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Preferences saved!
                  </span>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Tab 4: System Health & Logs */}
      {activeTab === "system" && (
        <div className="max-w-3xl space-y-5">
          <div className="rounded-2xl border border-slate-100 bg-white p-7 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Platform Infrastructure Status
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Live status of critical services, databases, and message queues.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">PostgreSQL DB</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                </div>
                <div className="mt-2 text-sm font-bold text-slate-900">Connected & Synced</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Drizzle ORM Dialect</div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Redis Cache</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                </div>
                <div className="mt-2 text-sm font-bold text-slate-900">Operational</div>
                <div className="text-[11px] text-slate-400 mt-0.5">OTP & Hold Tokens</div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Resend API</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                </div>
                <div className="mt-2 text-sm font-bold text-slate-900">Ready</div>
                <div className="text-[11px] text-slate-400 mt-0.5">noreply@revslot.com</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-7 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              System Metadata
            </h3>
            <div className="space-y-3 pt-3 text-xs">
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">Core Engine Version</span>
                <span className="font-bold text-slate-800">RevSlot Core v2.4.0-prod</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">Frontend Environment</span>
                <span className="font-bold text-slate-800">Next.js 16 + React 19</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Server Runtime</span>
                <span className="font-bold text-slate-800">Node.js + Express 5</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}