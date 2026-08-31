"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "@/features/admin/store/adminStore";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function AdminSettingsPage() {
  const { profile, isProfileLoading, error, fetchProfile, updateProfile } = useAdminStore();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setBio(profile.bio ?? "");
      setAvatarUrl(profile.avatarUrl ?? "");
    }
  }, [profile]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSaved(false);
    try {
      await updateProfile({
        name: name.trim() || undefined,
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch {
      // error already surfaced via store's `error` state
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordSaved(false);
    try {
      await updateProfile({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch {
      // error already surfaced via store's `error` state
    } finally {
      setSavingPassword(false);
    }
  };

  if (isProfileLoading && !profile) {
    return <div className="py-10 text-center text-slate-400">Loading…</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-1.5 text-2xl font-semibold tracking-tight text-on-surface">
          Settings
        </h1>
        <p className="text-sm text-slate-600">Manage your admin account.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_2fr]">
        {/* Profile summary card */}
        <div className="rounded-xl border border-slate-100 bg-surface-card p-6 shadow-surface">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-lg font-semibold text-primary">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                profile && initials(profile.name)
              )}
            </div>
            <p className="font-medium text-on-surface">{profile?.name}</p>
            <p className="text-sm text-slate-400">{profile?.email}</p>
            <span className="mt-3 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-primary">
              Super Admin
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile form */}
          <form
            onSubmit={handleProfileSubmit}
            className="rounded-xl border border-slate-100 bg-surface-card p-6 shadow-surface"
          >
            <h3 className="mb-4 text-base font-semibold text-on-surface">Profile</h3>

            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-slate-200 bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </div>

            <div className="mb-5">
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Avatar URL</label>
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-lg border border-slate-200 bg-surface px-3 py-2 text-sm text-on-surface placeholder:text-slate-400 focus:border-primary focus:outline-none"
              />
            </div>

            {error && !currentPassword && !newPassword && (
              <p className="mb-4 text-sm font-medium text-red-600">{error}</p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={savingProfile}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary shadow-surface hover:opacity-90 disabled:opacity-50"
              >
                {savingProfile ? "Saving…" : "Save changes"}
              </button>
              {profileSaved && (
                <span className="text-xs font-medium text-emerald-700">Saved</span>
              )}
            </div>
          </form>

          {/* Password form */}
          <form
            onSubmit={handlePasswordSubmit}
            className="rounded-xl border border-slate-100 bg-surface-card p-6 shadow-surface"
          >
            <h3 className="mb-4 text-base font-semibold text-on-surface">Change password</h3>

            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                Current password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </div>

            <div className="mb-5">
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                className="w-full rounded-lg border border-slate-200 bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-400">At least 8 characters.</p>
            </div>

            {error && (
              <p className="mb-4 text-sm font-medium text-red-600">{error}</p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={savingPassword || !currentPassword || !newPassword}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-hover disabled:opacity-50"
              >
                {savingPassword ? "Updating…" : "Update password"}
              </button>
              {passwordSaved && (
                <span className="text-xs font-medium text-emerald-700">Password updated</span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}