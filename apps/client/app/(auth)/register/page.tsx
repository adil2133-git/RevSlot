import RegisterForm from "@/features/auth/components/RegisterForm";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary px-12 py-14 text-on-primary lg:flex">
        <div>
          <Link href="/" className="text-lg font-semibold tracking-tight hover:opacity-80">
            RevSlot
          </Link>
        </div>

        <div className="max-w-sm">
          <h1 className="mb-4 text-[40px] font-semibold leading-[1.1] tracking-tight">
            Academic Access
          </h1>
          <p className="text-base leading-relaxed text-secondary/90">
            Empowering institutional reviewers with seamless project review
            scheduling and feedback tools.
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs text-secondary/70">
          <span>Trusted by 500+ institutions</span>
          <span className="h-1 w-1 rounded-full bg-secondary/40" />
          <span>ISO 27001 Certified</span>
        </div>

        {/* subtle ambient dot pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center bg-surface px-6 py-14 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="text-lg font-semibold tracking-tight text-primary hover:opacity-80">
              RevSlot
            </Link>
          </div>

          <h2 className="mb-1.5 text-2xl font-semibold tracking-tight text-on-surface">
            Reviewer Registration
          </h2>
          <p className="mb-8 text-sm text-slate-400">
            Create your account to start scheduling project reviews.
          </p>

          <RegisterForm />
        </div>
      </div>
    </div>
  );
}