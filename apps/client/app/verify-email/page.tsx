"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/features/auth/store/authStore";

type Status = "verifying" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const verifyEmail = useAuthStore((state) => state.verifyEmail);
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("This verification link is missing its token.");
      return;
    }

    verifyEmail({ token })
      .then((msg) => {
        setStatus("success");
        setMessage(msg);
      })
      .catch((err: Error) => {
        setStatus("error");
        setMessage(err.message || "This verification link is invalid or expired.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full max-w-sm rounded-xl bg-surface-card p-8 text-center shadow-surface">
      {status === "verifying" && (
        <>
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-slate-600">Verifying your email…</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 className="mb-2 text-lg font-semibold text-on-surface">Email verified</h1>
          <p className="mb-6 text-sm text-slate-600">{message}</p>
          <Link
            href="/dashboard"
            className="inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-surface transition-shadow hover:shadow-raised"
          >
            Go to dashboard
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-container text-error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </div>
          <h1 className="mb-2 text-lg font-semibold text-on-surface">Verification failed</h1>
          <p className="mb-6 text-sm text-slate-600">{message}</p>
          <Link
            href="/dashboard"
            className="inline-block rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-primary"
          >
            Go to dashboard
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6">
      <Suspense
        fallback={
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}