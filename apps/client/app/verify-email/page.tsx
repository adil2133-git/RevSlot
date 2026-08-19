"use client";

import VerifyEmailForm from "@/features/auth/components/VerifyEmailForm";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface">
      {/* Left branding panel */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-primary via-[#082a4d] to-[#041a33] px-12 py-10 text-on-primary lg:flex h-full overflow-hidden border-r border-slate-800">
        <div>
          <Link href="/" className="text-lg font-semibold tracking-tight transition-opacity hover:opacity-80">
            RevSlot
          </Link>
        </div>

        <div className="max-w-md my-auto">
          <span className="mb-2.5 inline-block rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold tracking-wide text-secondary uppercase">
            Review Management
          </span>
          <h1 className="mb-4 text-[42px] font-semibold leading-[1.1] tracking-tight">
            Academic Access
          </h1>
          <p className="text-base leading-relaxed text-secondary/80 mb-6">
            Empowering institutional reviewers with seamless project review
            scheduling and feedback tools.
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs text-secondary/60">
          <span>Trusted by 500+ institutions</span>
          <span className="h-1 w-1 rounded-full bg-secondary/40" />
          <span>ISO 27001 Certified</span>
        </div>

        {/* subtle ambient dot pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* Right form panel */}
      <div className="flex w-full flex-col justify-center bg-surface px-6 py-6 lg:w-1/2 h-full overflow-y-auto lg:overflow-hidden">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-4 lg:hidden">
            <Link href="/" className="text-lg font-semibold tracking-tight text-primary hover:opacity-80">
              RevSlot
            </Link>
          </div>

          <h2 className="mb-1 text-2xl font-bold tracking-tight text-on-surface">
            Verify Email
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            Enter the code sent to your email to verify your account.
          </p>

          <VerifyEmailForm />
        </div>
      </div>
    </div>
  );
}