import React from "react";
import NavbarLanding from "@/components/landing/NavbarLanding";
import HeroSection from "@/components/landing/HeroSection";
import ContrastSection from "@/components/landing/ContrastSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import WorkflowSection from "@/components/landing/WorkflowSection";
import CtaSection from "@/components/landing/CtaSection";
import FooterLanding from "@/components/landing/FooterLanding";

export const metadata = {
  title: "RevSlot — Academic & Technical Evaluation Scheduling",
  description:
    "Kill the back-and-forth messaging chaos. Set your defense availability once, share one item-locked link, and watch internal candidates and team reviewers lock in time slots without friction.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-primary">
      {/* Dynamic Header */}
      <NavbarLanding />

      <main>
        {/* Hero Section with Interactive Scheduling Mockup */}
        <HeroSection />

        {/* Contrast Comparison Section (The Old Way vs The RevSlot Way) */}
        <ContrastSection />

        {/* Engineered for Reviewers Features Grid */}
        <FeaturesSection />

        {/* 3-Step Setup Workflow */}
        <WorkflowSection />

        {/* High-Impact Bottom Call to Action */}
        <CtaSection />
      </main>

      {/* Clean Modern Footer */}
      <FooterLanding />
    </div>
  );
}