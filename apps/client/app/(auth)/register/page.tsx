import RegisterForm from "@/features/auth/components/RegisterForm";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface">
      {/* Left branding panel */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-primary via-[#082a4d] to-[#041a33] px-10 py-7 lg:px-12 lg:py-8 text-on-primary lg:flex h-full overflow-hidden border-r border-slate-800">
        <div>
          <Link href="/" className="text-lg font-semibold tracking-tight transition-opacity hover:opacity-80">
            RevSlot
          </Link>
        </div>

        <div className="max-w-md my-auto py-2">
          <span className="mb-2 inline-block rounded-full bg-secondary/10 px-3 py-0.5 text-[11px] font-semibold tracking-wide text-secondary uppercase">
            Review Management
          </span>
          <h1 className="mb-2 text-2xl font-bold leading-tight tracking-tight lg:text-[34px]">
            Academic Access
          </h1>
          <p className="text-xs sm:text-sm leading-relaxed text-secondary/80 mb-4">
            Empowering institutional reviewers with seamless project review
            scheduling and feedback tools.
          </p>

          {/* Visual Mockup Container */}
          <div className="relative rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
              </div>
              <span className="text-[9px] font-bold tracking-wider text-secondary/50 uppercase font-mono">Review Slots Calendar</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-white/5 p-2.5 border border-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                    01
                  </div>
                  <div>
                    <h4 className="text-[11px] font-semibold text-white">Capstone Review #2</h4>
                    <p className="text-[9px] text-secondary/60">10:00 AM - 11:30 AM</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-medium text-emerald-300">
                  Scheduled
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-white/5 p-2.5 border border-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 text-xs font-semibold">
                    02
                  </div>
                  <div>
                    <h4 className="text-[11px] font-semibold text-white">Advisory Committee Panel</h4>
                    <p className="text-[9px] text-secondary/60">02:00 PM - 03:00 PM</p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-medium text-amber-300">
                  Pending
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-[11px] text-secondary/60">
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
      <div className="flex w-full flex-col justify-center bg-surface px-6 sm:px-10 lg:w-1/2 h-full overflow-hidden">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-2 lg:hidden">
            <Link href="/" className="text-lg font-semibold tracking-tight text-primary hover:opacity-80">
              RevSlot
            </Link>
          </div>

          <h2 className="mb-0.5 text-2xl font-bold tracking-tight text-on-surface">
            Reviewer Registration
          </h2>
          <p className="mb-2.5 text-xs sm:text-sm text-slate-500">
            Create your account to start scheduling project reviews.
          </p>

          <RegisterForm />
        </div>
      </div>
    </div>
  );
}