import ForgotPasswordFlow from "@/features/auth/components/ForgotPasswordFlow";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary px-12 py-14 text-on-primary lg:flex">
        <div>
          <span className="text-lg font-semibold tracking-tight">RevSlot</span>
        </div>

        <div className="max-w-sm">
          <h1 className="mb-4 text-[40px] font-semibold leading-[1.1] tracking-tight">
            Forgot your password?
          </h1>
          <p className="text-base leading-relaxed text-secondary/90">
            No problem — we&apos;ll send a reset code to your email so you can
            get back into your reviewer account.
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs text-secondary/70">
          <span>Trusted by 500+ institutions</span>
          <span className="h-1 w-1 rounded-full bg-secondary/40" />
          <span>ISO 27001 Certified</span>
        </div>

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="flex w-full items-center justify-center bg-surface px-6 py-14 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <span className="text-lg font-semibold tracking-tight text-primary">
              RevSlot
            </span>
          </div>

          <h2 className="mb-1.5 text-2xl font-semibold tracking-tight text-on-surface">
            Reset your password
          </h2>
          <p className="mb-8 text-sm text-slate-600">
            Enter your email and we&apos;ll send you a 6-digit code.
          </p>

          <ForgotPasswordFlow />
        </div>
      </div>
    </div>
  );
}