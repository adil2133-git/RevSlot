"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/authStore";
import NotificationBell from "@/features/notifications/components/NotificationBell";
import {
  LayoutGrid,
  Calendar,
  CalendarCheck,
  Layers,
  HelpCircle,
  MessageSquare,
  Palmtree,
  Wallet,
  Settings,
  ShieldCheck,
  ChevronsUpDown,
  ChevronUp,
  LogOut,
  Download,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  hasDot?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutGrid,
  },
  {
    href: "/availability",
    label: "Availability",
    icon: Calendar,
  },
  {
    href: "/dashboard/bookings",
    label: "Bookings",
    icon: CalendarCheck,
  },
  {
    href: "/dashboard/event-types",
    label: "Event Types",
    icon: Layers,
  },
  {
    href: "/dashboard/question-banks",
    label: "Question Banks",
    icon: HelpCircle,
  },
  {
    href: "/dashboard/feedback-forms",
    label: "Feedback & Forms",
    icon: MessageSquare,
  },
  {
    href: "/dashboard/vacation",
    label: "Vacation Mode",
    icon: Palmtree,
    hasDot: true,
  },
  {
    href: "/dashboard/wallet",
    label: "Earnings & Wallet",
    icon: Wallet,
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface SidebarProps {
  collapsed?: boolean;
}

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close popover on outside click or ESC
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setPopoverOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPopoverOpen(false);
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/reviewer/login");
  };

  const displayName = user?.name || "Reviewer";
  const displayEmail = user?.email || "";
  const displayUsername = user?.username ? `@${user.username}` : (user?.role || "Reviewer");
  const initials = user?.name ? getInitials(user.name) : "R";

  // -------------------------------------------------------------
  // VARIANT C: COLLAPSED RAIL (Width 72px)
  // -------------------------------------------------------------
  if (collapsed) {
    return (
      <aside className="relative flex h-full w-[72px] shrink-0 flex-col items-center justify-between border-r border-slate-200/80 bg-white py-4 transition-all duration-200">
        {/* Top Brand Shield Icon */}
        <div className="flex flex-col items-center gap-6">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-xs hover:scale-105 transition-transform"
            title="RevSlot Reviewer Suite"
          >
            <ShieldCheck className="h-6 w-6" />
          </Link>

          {/* Navigation Icon Stack */}
          <nav className="flex flex-col items-center gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                    active
                      ? "bg-primary text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-5 w-5" />

                  {/* Hover Tooltip Reveal */}
                  <span className="absolute left-full ml-3 hidden rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-lg whitespace-nowrap group-hover:block z-50 animate-in fade-in duration-150">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Stack: Install Icon + User Avatar */}
        <div className="flex flex-col items-center gap-3">
          <button
            title="Install App"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-primary transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" />
          </button>

          <button
            onClick={() => setPopoverOpen(!popoverOpen)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white text-xs font-bold hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer"
            title={displayName}
          >
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={displayName}
                fill
                sizes="40px"
                className="rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </button>
        </div>
      </aside>
    );
  }

  // -------------------------------------------------------------
  // VARIANT A & B: FULL NOMINAL SIDEBAR (Width 248px)
  // -------------------------------------------------------------
  return (
    <aside className="relative flex h-full w-[248px] shrink-0 flex-col justify-between border-r border-slate-200/80 bg-white">
      {/* Top Header & Main Navigation */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white shadow-xs group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-primary leading-none block">
                RevSlot
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mt-0.5">
                Reviewer Suite
              </span>
            </div>
          </Link>
        </div>

        {/* Main Nav Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Main
          </p>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  active
                    ? "bg-primary text-white shadow-sm font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 ${
                      active
                        ? "text-white"
                        : "text-slate-400 group-hover:text-primary"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {/* Right Badges / Indicators */}
                {item.hasDot && !item.badge && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      active ? "bg-white" : "bg-slate-300"
                    }`}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Install App Card + User Account Popover */}
      <div className="p-3 border-t border-slate-100 space-y-2 bg-white relative">
        {/* Install App Pill Button */}
        <button
          className="flex w-full items-center justify-between rounded-xl bg-slate-100/70 hover:bg-slate-200/70 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Install App</span>
          </div>
          <span className="text-[10px] font-medium text-slate-400">v2.4</span>
        </button>

        {/* VARIANT B: ELEVATED USER POPOVER (8px above the user tile) */}
        {popoverOpen && (
          <div
            ref={popoverRef}
            className="absolute bottom-[calc(100%+8px)] left-3 right-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xl shadow-blue-950/15 z-50 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header: User Info + Role */}
            <div className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {displayName}
                </h4>
                <span className="rounded-md bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wide">
                  {user?.role ? user.role : "Faculty"}
                </span>
              </div>
              {displayEmail && (
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {displayEmail}
                </p>
              )}
            </div>

            {/* Menu Items: Only Settings */}
            <div className="py-2 space-y-0.5 text-xs font-semibold text-slate-700">
              <Link
                href="/dashboard/settings"
                onClick={() => setPopoverOpen(false)}
                className="flex items-center justify-between rounded-xl px-2.5 py-2 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="h-4 w-4 text-slate-400" />
                  <span>Settings</span>
                </div>
                <span className="rounded bg-blue-50 border border-blue-200/60 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                  Suite
                </span>
              </Link>
            </div>

            {/* Divider & Log out */}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4 text-rose-500" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}

        {/* User Tile / Trigger */}
        <button
          ref={triggerRef}
          onClick={() => setPopoverOpen(!popoverOpen)}
          className={`flex w-full items-center justify-between rounded-xl p-2 transition-all cursor-pointer ${
            popoverOpen
              ? "bg-blue-50/90 border border-blue-200/80 shadow-xs"
              : "hover:bg-slate-50 border border-transparent"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-white text-xs font-bold">
              {user?.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={displayName}
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-xs font-bold text-slate-900 leading-tight">
                {displayName}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {displayUsername}
              </p>
            </div>
          </div>

          {popoverOpen ? (
            <ChevronUp className="h-4 w-4 text-primary shrink-0" />
          ) : (
            <ChevronsUpDown className="h-4 w-4 text-slate-400 shrink-0" />
          )}
        </button>
      </div>
    </aside>
  );
}