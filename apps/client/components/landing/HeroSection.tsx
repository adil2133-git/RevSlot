"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Sparkles } from "lucide-react";
import InteractiveHeroMockup from "./InteractiveHeroMockup";

export default function HeroSection() {
  return (
    <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden bg-white">
      {/* Subtle top background gradient pattern */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-blue-50/70 via-slate-50/40 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="container-page text-center">
        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/90 hover:bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition-colors mb-6 cursor-pointer">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span>RevSlot 2.0: Engineered for academic &amp; technical evaluations</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
        </div>

        {/* Hero Main Headline */}
        <h1 className="mx-auto max-w-4xl text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
          Coordinating reviews over chat is broken.{" "}
          <span className="text-primary block sm:inline">Kill the back-and-forth.</span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed mb-8">
          Set your defense availability once, share one item-locked link, and watch internal candidates and team reviewers lock in time slots without friction. Zero account required, zero timezone ambiguity.
        </p>

        {/* Primary CTA Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-5">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all hover:scale-105 active:scale-95"
          >
            <span>Create your booking link</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Micro-trust indicators */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500 mb-14">
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            Free for academic reviewers
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            Instant 3-minute setup
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            No credit card required
          </span>
        </div>

        {/* Interactive Mockup Component */}
        <InteractiveHeroMockup />
      </div>
    </section>
  );
}
