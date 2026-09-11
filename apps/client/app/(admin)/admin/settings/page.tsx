"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/features/admin/store/adminStore";
import { useAuthStore } from "@/features/auth/store/authStore";
import AvatarCropModal from "@/features/auth/components/AvatarCropModal";

type SettingsTab = "profile" | "account" | "platform" | "notifications";

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  {
    id: "profile",
    label: "Profile",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: "account",
    label: "Account & Security",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    id: "platform",
    label: "Academic & System",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    ),
  },
];

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function initials(name: string) {
  if (!name) return "??";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(iso?: string | null) {
  if (!iso) return "Oct 12, 2023";
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, logout, updateAvatar } = useAuthStore();
  const { profile, isProfileLoading, error, fetchProfile, updateProfile } = useAdminStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // Profile fields
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [department, setDepartment] = useState("Academic Operations");
  const [contactNumber, setContactNumber] = useState("+1 (555) 019-2834");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Avatar states
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [cropModalSrc, setCropModalSrc] = useState<string | null>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Platform & System Configuration fields
  const [academicSession, setAcademicSession] = useState("2024-2025 Tier I");
  const [defaultDuration, setDefaultDuration] = useState("30");
  const [holdTimeout, setHoldTimeout] = useState("10");
  const [noShowThreshold, setNoShowThreshold] = useState("5.0");
  const [gracePeriodHours, setGracePeriodHours] = useState("24");
  const [savingPlatform, setSavingPlatform] = useState(false);
  const [platformSaved, setPlatformSaved] = useState(false);

  // Notification Preferences
  const [notifyOnReviewerRegister, setNotifyOnReviewerRegister] = useState(true);
  const [notifyOnNoShow, setNotifyOnNoShow] = useState(true);
  const [notifyWeeklyDigest, setNotifyWeeklyDigest] = useState(true);
  const [notifyAuditLog, setNotifyAuditLog] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [notificationsSaved, setNotificationsSaved] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  // Avatar file picker & crop
  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setAvatarError(null);

    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      setAvatarError("Only JPEG, PNG, or WebP images are allowed");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Image must be under 2MB");
      return;
    }

    setCropModalSrc(URL.createObjectURL(file));
  };

  const handleCropConfirm = async (blob: Blob) => {
    setAvatarSaving(true);
    setAvatarError(null);
    try {
      const croppedFile = new File([blob], "admin-avatar.jpg", { type: "image/jpeg" });
      await updateAvatar(croppedFile);
      setCropModalSrc(null);
      await fetchProfile();
    } catch (err) {
      setAvatarError((err as Error).message || "Avatar upload failed");
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarSaving(true);
    setAvatarError(null);
    try {
      await updateProfile({ avatarUrl: "" });
      await fetchProfile();
    } catch (err) {
      setAvatarError((err as Error).message || "Failed to remove avatar");
    } finally {
      setAvatarSaving(false);
    }
  };

  // Profile Dirty Check
  const profileDirty = useMemo(() => {
    if (!profile) return false;
    return name.trim() !== (profile.name || "") || bio.trim() !== (profile.bio || "");
  }, [profile, name, bio]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSaved(false);
    setProfileError(null);
    try {
      await updateProfile({
        name: name.trim() || undefined,
        bio: bio.trim(),
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      setProfileError((err as Error).message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // Password submission
  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmitPassword =
    currentPassword.length > 0 && newPassword.length >= 8 && !passwordMismatch && !savingPassword;

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
    return score;
  }, [newPassword]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitPassword) return;

    setSavingPassword(true);
    setPasswordSaved(false);
    setPasswordError(null);
    try {
      await updateProfile({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err) {
      setPasswordError((err as Error).message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSavePlatform = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPlatform(true);
    setTimeout(() => {
      setSavingPlatform(false);
      setPlatformSaved(true);
      setTimeout(() => setPlatformSaved(false), 3000);
    }, 600);
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNotifications(true);
    setTimeout(() => {
      setSavingNotifications(false);
      setNotificationsSaved(true);
      setTimeout(() => setNotificationsSaved(false), 3000);
    }, 500);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  const effectiveAvatar = profile?.avatarUrl || user?.avatarUrl;
  const effectiveName = profile?.name || user?.name || "Administrator";
  const effectiveEmail = profile?.email || user?.email || "admin@revslot.com";

  return (
    <div className="space-y-6 pb-12">
      {/* Hidden File Input for Avatar Upload */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleAvatarSelect}
        className="hidden"
      />

      {/* Crop Modal */}
      {cropModalSrc && (
        <AvatarCropModal
          imageSrc={cropModalSrc}
          onCancel={() => setCropModalSrc(null)}
          onConfirm={handleCropConfirm}
          saving={avatarSaving}
        />
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your administrator profile, security, platform parameters, and notifications.
        </p>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? "text-[#003366]"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span className={isActive ? "text-[#003366]" : "text-slate-400"}>
                {tab.icon}
              </span>
              {tab.label}
              {isActive && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#003366]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        {/* Left Column: Interactive Admin Profile Card */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              {/* Interactive Avatar Upload Container */}
              <div className="relative group mb-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#e6eef5] text-2xl font-extrabold text-[#003366] ring-4 ring-slate-50 overflow-hidden shadow-xs">
                  {effectiveAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={effectiveAvatar}
                      alt={effectiveName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials(effectiveName)
                  )}
                </div>

                {/* Hover overlay with camera button */}
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarSaving}
                  title="Upload profile image"
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-slate-900/60 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 cursor-pointer disabled:opacity-50"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span className="mt-1 text-[10px] font-bold">Change</span>
                </button>
              </div>

              {/* Action Buttons under avatar */}
              <div className="mb-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarSaving}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {avatarSaving ? "Uploading..." : "Upload Photo"}
                </button>
                {effectiveAvatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={avatarSaving}
                    className="rounded-xl border border-red-100 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                    title="Remove avatar"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>

              {avatarError && (
                <p className="mb-3 text-xs font-medium text-red-600">{avatarError}</p>
              )}

              {/* Admin Name & Credentials */}
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {effectiveName}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 truncate max-w-full">
                {effectiveEmail}
              </p>

              <div className="mt-3 flex items-center gap-1.5 rounded-full bg-[#001f3f] px-3 py-1 text-[11px] font-bold text-white shadow-xs">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Super Admin
              </div>
            </div>

            {/* Quick Overview List */}
            <div className="mt-6 border-t border-slate-100 pt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Status</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active & Authorized
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Email Verified</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 border border-emerald-100">
                  Verified
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Member Since</span>
                <span className="font-semibold text-slate-700">
                  {formatDate(profile?.createdAt)}
                </span>
              </div>
            </div>

            {/* Quick Logout */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/50 py-2.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-100 cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Content Panels */}
        <div className="space-y-6">
          {/* TAB 1: PROFILE */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <form
                onSubmit={handleProfileSubmit}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-5 border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your display name, departmental title, and admin bio.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dr. Katherine Vance"
                      className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-sm text-slate-900 focus:border-[#003366] focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        Department / Division
                      </label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="Academic Review Board"
                        className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-sm text-slate-900 focus:border-[#003366] focus:bg-white focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        Contact / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        placeholder="+1 (555) 019-2834"
                        className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-sm text-slate-900 focus:border-[#003366] focus:bg-white focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">
                        Administrator Bio & Scope
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {bio.length} / 500
                      </span>
                    </div>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, 500))}
                      rows={4}
                      placeholder="Brief description of your administrative responsibilities and institution oversight..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-[#f8fafc] p-3.5 text-sm text-slate-900 focus:border-[#003366] focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {profileError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                    {profileError}
                  </div>
                )}

                <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="submit"
                    disabled={savingProfile || !profileDirty}
                    className="rounded-xl bg-[#001f3f] px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-[#001730] transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {savingProfile ? "Saving Changes..." : "Save Changes"}
                  </button>
                  {profileSaved && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                      Profile saved successfully!
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: ACCOUNT & SECURITY */}
          {activeTab === "account" && (
            <div className="space-y-6">
              {/* Account Credentials Card */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-5 border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900">Account Credentials</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your platform identifier and authorization tier.
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                    <div>
                      <p className="text-xs font-medium text-slate-400">Primary Admin Email</p>
                      <p className="font-bold text-slate-900 mt-0.5">{effectiveEmail}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                      Primary
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                    <div>
                      <p className="text-xs font-medium text-slate-400">Security Tier</p>
                      <p className="font-bold text-slate-900 mt-0.5">Tier 1 — Full Super Administrator Privileges</p>
                    </div>
                    <span className="rounded-full bg-[#001f3f] px-2.5 py-1 text-xs font-bold text-white">
                      Highest
                    </span>
                  </div>
                </div>
              </div>

              {/* Password Change Card */}
              <form
                onSubmit={handlePasswordSubmit}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-5 border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900">Change Password</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ensure your account is protected with a strong, distinct password.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-2.5 pr-10 text-sm text-slate-900 focus:border-[#003366] focus:bg-white focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showCurrentPass ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        minLength={8}
                        className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-2.5 pr-10 text-sm text-slate-900 focus:border-[#003366] focus:bg-white focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showNewPass ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    {newPassword && (
                      <div className="mt-2 space-y-1">
                        <div className="flex gap-1.5 h-1.5 w-full">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`h-full flex-1 rounded-full transition-all duration-300 ${
                                passwordStrength >= step
                                  ? passwordStrength === 4
                                    ? "bg-emerald-500"
                                    : passwordStrength >= 2
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                                  : "bg-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-[11px] font-medium text-slate-400">
                          Strength:{" "}
                          {passwordStrength === 4
                            ? "Strong"
                            : passwordStrength >= 2
                            ? "Medium"
                            : "Weak"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm text-slate-900 focus:outline-none transition-colors ${
                        passwordMismatch
                          ? "border-red-400 bg-red-50/30 focus:border-red-500"
                          : "border-slate-200 bg-[#f8fafc] focus:border-[#003366] focus:bg-white"
                      }`}
                    />
                    {passwordMismatch && (
                      <p className="mt-1 text-xs font-semibold text-red-600">
                        Passwords do not match.
                      </p>
                    )}
                  </div>
                </div>

                {passwordError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                    {passwordError}
                  </div>
                )}

                <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="submit"
                    disabled={!canSubmitPassword}
                    className="rounded-xl bg-[#001f3f] px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-[#001730] transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {savingPassword ? "Updating Password..." : "Update Password"}
                  </button>
                  {passwordSaved && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                      Password updated!
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: ACADEMIC & SYSTEM CONFIGURATION */}
          {activeTab === "platform" && (
            <div className="space-y-6">
              <form
                onSubmit={handleSavePlatform}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-5 border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900">Academic Session & Policies</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure institutional evaluation cycles and slot duration rules.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        Active Academic Session
                      </label>
                      <input
                        type="text"
                        value={academicSession}
                        onChange={(e) => setAcademicSession(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#003366] focus:bg-white focus:outline-none"
                      />
                      <p className="mt-1 text-[11px] text-slate-400">
                        Displayed in the bottom navigation badge across the portal.
                      </p>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        Default Review Duration
                      </label>
                      <select
                        value={defaultDuration}
                        onChange={(e) => setDefaultDuration(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#003366] focus:bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="30">30 Minutes (Standard Review)</option>
                        <option value="45">45 Minutes (Milestone Defense)</option>
                        <option value="60">60 Minutes (Comprehensive Capstone)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        Temporary Hold Timeout
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={holdTimeout}
                          onChange={(e) => setHoldTimeout(e.target.value)}
                          min={5}
                          max={30}
                          className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#003366] focus:bg-white focus:outline-none"
                        />
                        <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Minutes</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Hold lock duration during intern booking checkout.
                      </p>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        No-Show Alert Threshold
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.5"
                          value={noShowThreshold}
                          onChange={(e) => setNoShowThreshold(e.target.value)}
                          min={1}
                          max={25}
                          className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#003366] focus:bg-white focus:outline-none"
                        />
                        <span className="text-xs font-bold text-slate-500">%</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Flags reviewers whose no-show rates exceed this baseline.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="submit"
                    disabled={savingPlatform}
                    className="rounded-xl bg-[#001f3f] px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-[#001730] transition-colors cursor-pointer"
                  >
                    {savingPlatform ? "Saving Configuration..." : "Save Platform Parameters"}
                  </button>
                  {platformSaved && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                      System parameters updated!
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <form
                onSubmit={handleSaveNotifications}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-5 border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900">Super Admin Alert Preferences</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Control automated notifications for platform events and evaluation milestones.
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  {/* Item 1 */}
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900">New Reviewer Onboarding</p>
                      <p className="text-xs text-slate-500">
                        Receive instant alerts when a new faculty member or reviewer signs up.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifyOnReviewerRegister((v) => !v)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifyOnReviewerRegister ? "bg-[#001f3f]" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          notifyOnReviewerRegister ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900">No-Show & Absence Warnings</p>
                      <p className="text-xs text-slate-500">
                        Send alerts when an intern or reviewer misses a confirmed review session.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifyOnNoShow((v) => !v)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifyOnNoShow ? "bg-[#001f3f]" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          notifyOnNoShow ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Weekly Executive Digest</p>
                      <p className="text-xs text-slate-500">
                        Email automated weekly summaries of completed reviews, no-show trends, and KPIs.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifyWeeklyDigest((v) => !v)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifyWeeklyDigest ? "bg-[#001f3f]" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          notifyWeeklyDigest ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Item 4 */}
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Real-Time Audit Log Warnings</p>
                      <p className="text-xs text-slate-500">
                        Notify upon security-sensitive events such as reviewer status toggling or bulk deletions.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifyAuditLog((v) => !v)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifyAuditLog ? "bg-[#001f3f]" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          notifyAuditLog ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="submit"
                    disabled={savingNotifications}
                    className="rounded-xl bg-[#001f3f] px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-[#001730] transition-colors cursor-pointer"
                  >
                    {savingNotifications ? "Saving Preferences..." : "Save Preferences"}
                  </button>
                  {notificationsSaved && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                      Notification preferences updated!
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}