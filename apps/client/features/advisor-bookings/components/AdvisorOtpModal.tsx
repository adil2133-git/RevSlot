"use client";

import { useState, useEffect, useRef } from "react";
import { advisorApi } from "../services/advisorApi";
import PoweredByFooter from "@/features/booking/components/PoweredByFooter";

interface AdvisorOtpModalProps {
  onSuccess: (email: string) => void;
}

export default function AdvisorOtpModal({ onSuccess }: AdvisorOtpModalProps) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await advisorApi.sendOtp(email.trim().toLowerCase());
      setStep("otp");
      setResendTimer(60);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((digit) => digit !== "")) {
      handleVerifyOtp(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otp.join("");
    if (code.length !== 6) {
      setError("Please enter all 6 digits.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const { advisorEmail } = await advisorApi.verifyOtp(email.trim().toLowerCase(), code);
      onSuccess(advisorEmail);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Invalid or expired verification code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-surface px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-surface-card p-8 text-center shadow-surface">
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-on-primary shadow-sm">
            R
          </div>
          <h1 className="mt-4 text-xl font-bold text-on-surface">Advisor Portal</h1>
          <p className="mt-1 text-xs text-slate-500">
            {step === "email"
              ? "Enter your email to view and manage your booked slots"
              : `Enter 6-digit code sent to ${email}`}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-200">
            {error}
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="text-left">
              <label htmlFor="advisor-email" className="block text-xs font-semibold text-slate-700 mb-1">
                Advisor Email Address
              </label>
              <input
                id="advisor-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="advisor@example.com"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-on-surface placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Sending Code…" : "Send Verification Code"}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="h-12 w-11 rounded-lg border border-slate-300 text-center text-lg font-bold text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleVerifyOtp()}
              disabled={loading || otp.some((d) => !d)}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Verifying…" : "Verify Code & Continue"}
            </button>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <button
                type="button"
                onClick={() => setStep("email")}
                className="hover:text-primary transition-colors font-medium"
              >
                ← Change Email
              </button>

              <button
                type="button"
                onClick={() => handleSendOtp()}
                disabled={resendTimer > 0 || loading}
                className="font-semibold text-primary hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend Code"}
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 border-t border-slate-100 pt-4">
          <PoweredByFooter />
        </div>
      </div>
    </div>
  );
}
