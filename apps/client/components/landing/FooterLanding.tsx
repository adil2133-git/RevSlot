"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function FooterLanding() {
  return (
    <footer className="border-t border-slate-200/80 bg-white py-8">
      <div className="container-page flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <Image
            src="/icons/icon-192x192.png"
            alt="RevSlot Logo"
            width={24}
            height={24}
            className="h-6 w-6 rounded-lg object-contain"
          />
          <span className="font-bold text-slate-800 text-sm">RevSlot</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 font-medium">
          <Link href="/privacy" className="hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-primary transition-colors">
            Terms of Service
          </Link>
          <a href="mailto:support@revslot.com" className="hover:text-primary transition-colors">
            Contact
          </a>
        </div>

        {/* Copyright */}
        <div>
          © {new Date().getFullYear()} RevSlot Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
