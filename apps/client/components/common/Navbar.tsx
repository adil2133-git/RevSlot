"use client";

import Link from "next/link";
import { useAuthStore } from "@/features/auth/store/authStore";

export default function Navbar() {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="border-b border-slate-100">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight text-primary hover:opacity-80">
          RevSlot
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-on-surface md:flex">
          <a href="#features" className="hover:text-primary">Features</a>
          <a href="#how-it-works" className="hover:text-primary">How it works</a>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary shadow-surface transition-shadow hover:shadow-raised">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login/reviewer" className="text-sm font-medium text-on-surface hover:text-primary">
                Log in
              </Link>
              <Link href="/register" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary shadow-surface transition-shadow hover:shadow-raised">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}