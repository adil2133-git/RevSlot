"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/features/auth/store/authStore";
import { User, Menu, X, ArrowUpRight } from "lucide-react";

export default function NavbarLanding() {
  const user = useAuthStore((state) => state.user);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs"
          : "bg-white border-b border-slate-100"
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/icons/icon-192x192.png"
            alt="RevSlot Logo"
            width={36}
            height={36}
            className="h-9 w-9 rounded-xl shadow-xs group-hover:scale-105 transition-transform object-contain"
            priority
          />
          <span className="text-xl font-bold tracking-tight text-primary">
            RevSlot
          </span>
        </Link>

        {/* Center Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a
            href="#features"
            className="hover:text-primary transition-colors cursor-pointer"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="hover:text-primary transition-colors cursor-pointer"
          >
            How it works
          </a>
          <a
            href="#contrast"
            className="hover:text-primary transition-colors cursor-pointer"
          >
            Solution
          </a>
        </nav>

        {/* Right Action Items */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary/95 transition-all"
            >
              <span>Dashboard</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary/95 transition-all"
              >
                <span>Create your booking link</span>
              </Link>
              <Link
                href="/reviewer/login"
                title="Reviewer Login"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-primary transition-colors"
              >
                <User className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 py-5 space-y-4 animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-3 text-sm font-semibold text-slate-700">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 rounded-lg hover:bg-slate-50"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 rounded-lg hover:bg-slate-50"
            >
              How it works
            </a>
            <a
              href="#contrast"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 rounded-lg hover:bg-slate-50"
            >
              Solution
            </a>
          </nav>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-xs"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-xs"
                >
                  Create your booking link
                </Link>
                <Link
                  href="/reviewer/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Log in to Reviewer Portal
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
