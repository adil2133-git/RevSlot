"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Sparkles } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-[#001f3f] py-24 text-white text-center">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-radial from-blue-600/20 via-transparent to-transparent opacity-60 blur-3xl pointer-events-none" />

      <div className="container-page relative z-10 max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white mb-5">
          Stop scheduling in chat threads.
        </h2>

        <p className="text-base sm:text-lg text-blue-100/80 leading-relaxed mb-10 max-w-xl mx-auto">
          Join hundreds of faculty members, technical reviewers, and capstone evaluators reclaiming their research calendar today.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-primary shadow-xl hover:bg-blue-50 transition-all hover:scale-105 active:scale-95"
          >
            <span>Create your booking link</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-blue-200/70">
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-blue-300" />
            No credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-blue-300" />
            3-minute setup
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-blue-300" />
            Free for academic review
          </span>
        </div>
      </div>
    </section>
  );
}
