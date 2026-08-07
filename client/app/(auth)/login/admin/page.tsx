import LoginForm from "@/features/auth/components/LoginForm";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary px-12 py-14 text-on-primary lg:flex">
        <div>
          <span className="text-lg font-semibold tracking-tight">RevSlot</span>
        </div>

        <div className="max-w-sm">
          <h1 className="mb-4 text-[40px] font-semibold leading-[1.1] tracking-tight">
            Admin Console
          </h1>
          <p className="text-base leading-relaxed text-secondary/90">
            Oversee reviewers, monitor bookings, and manage institutional
            review operations.
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs text-secondary/70">
          <span>Restricted access</span>
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

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center bg-surface px-6 py-14 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <span className="text-lg font-semibold tracking-tight text-primary">
              RevSlot
            </span>
          </div>

          <h2 className="mb-1.5 text-2xl font-semibold tracking-tight text-on-surface">
            Admin Login
          </h2>
          <p className="mb-8 text-sm text-slate-400">
            Authorized personnel only.
          </p>

          <LoginForm role="admin" />
        </div>
      </div>
    </div>
  );
}