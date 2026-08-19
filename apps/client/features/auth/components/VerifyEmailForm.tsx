"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";

export default function VerifyEmailForm() {
  const router = useRouter();
  const { pendingVerificationEmail, verifyEmail, resendVerification, isLoading, error } = useAuthStore();
  const [otp, setOtp] = useState("");
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    // No email pending verification (e.g. direct nav or page refresh
    // lost the in-memory store) — send them back to register.
    if (!pendingVerificationEmail) {
      router.replace("/register");
    }
  }, [pendingVerificationEmail, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingVerificationEmail) return;
    try {
      await verifyEmail({ email: pendingVerificationEmail, otp });
      router.push("/dashboard");
    } catch {
      // error already captured in store; surfaced below
    }
  };

  const onResend = async () => {
    if (!pendingVerificationEmail) return;
    setResendMessage(null);
    try {
      const message = await resendVerification({ email: pendingVerificationEmail });
      setResendMessage(message);
    } catch {
      // error already captured in store; surfaced below
    }
  };

  if (!pendingVerificationEmail) return null;

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        We sent a 6-digit code to <span className="font-semibold text-on-surface">{pendingVerificationEmail}</span>.
        Enter it below to verify your account.
      </p>

      <form onSubmit={onSubmit} className="space-y-3.5">
        <div>
          <label htmlFor="otp" className="mb-1 block text-[13px] font-semibold text-slate-600">
            Verification Code
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/40 px-4 py-2 text-center text-lg tracking-[0.3em] outline-none transition-all placeholder:tracking-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-primary focus:bg-white focus:ring-4 focus:ring-secondary/50"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-error-container px-4 py-2 text-sm text-error">
            {error}
          </p>
        )}

        {resendMessage && (
          <p className="rounded-lg bg-secondary/50 px-4 py-2 text-sm text-primary">
            {resendMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading || otp.length !== 6}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-on-primary shadow-surface transition-all duration-200 hover:bg-primary/95 hover:shadow-raised hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {isLoading ? "Verifying…" : "Verify Email"}
        </button>

        <p className="text-center text-sm text-slate-400 pt-1">
          Didn&apos;t get a code?{" "}
          <button
            type="button"
            onClick={onResend}
            disabled={isLoading}
            className="font-semibold text-primary transition-colors hover:text-primary/80 hover:underline disabled:opacity-60"
          >
            Resend code
          </button>
        </p>
      </form>
    </div>
  );
}