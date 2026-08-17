"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordFormValues,
  type ResetPasswordFormValues,
} from "../validation/authSchema";
import { useAuthStore } from "../store/authStore";

type Step = "request" | "reset" | "done";

export default function ForgotPasswordFlow() {
  const router = useRouter();
  const { forgotPassword, resetPassword, isLoading, error } = useAuthStore();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const requestForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onRequestSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      const message = await forgotPassword(values);
      setEmail(values.email);
      setInfoMessage(message);
      setStep("reset");
    } catch {
      // error already captured in store; surfaced below
    }
  };

  const onResetSubmit = async (values: ResetPasswordFormValues) => {
    try {
      await resetPassword({
        email,
        otp: values.otp,
        newPassword: values.newPassword,
      });
      setStep("done");
      // Reset doesn't log the user in — send them to log in with the
      // new password after a moment.
      setTimeout(() => router.push("/login/reviewer"), 1800);
    } catch {
      // error already captured in store; surfaced below
    }
  };

  if (step === "done") {
    return (
      <div className="rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-primary">
        Password reset — redirecting you to log in…
      </div>
    );
  }

  if (step === "reset") {
    return (
      <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-5">
        {infoMessage && (
          <p className="rounded-lg bg-secondary px-4 py-2.5 text-sm text-primary">
            {infoMessage}
          </p>
        )}

        <div>
          <label htmlFor="otp" className="mb-1.5 block text-sm font-medium text-on-surface">
            6-digit code
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            {...resetForm.register("otp")}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-center text-lg tracking-[0.3em] outline-none transition-shadow focus:border-primary focus:ring-4 focus:ring-secondary"
          />
          {resetForm.formState.errors.otp && (
            <p className="mt-1.5 text-sm text-error">{resetForm.formState.errors.otp.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-on-surface">
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            placeholder="••••••••"
            {...resetForm.register("newPassword")}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition-shadow focus:border-primary focus:ring-4 focus:ring-secondary"
          />
          {resetForm.formState.errors.newPassword && (
            <p className="mt-1.5 text-sm text-error">
              {resetForm.formState.errors.newPassword.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-on-surface">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            {...resetForm.register("confirmPassword")}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition-shadow focus:border-primary focus:ring-4 focus:ring-secondary"
          />
          {resetForm.formState.errors.confirmPassword && (
            <p className="mt-1.5 text-sm text-error">
              {resetForm.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-error-container px-4 py-2.5 text-sm text-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-medium text-on-primary shadow-surface transition-shadow hover:shadow-raised disabled:opacity-60"
        >
          {isLoading ? "Resetting…" : "Reset Password"}
        </button>

        <button
          type="button"
          onClick={() => setStep("request")}
          className="w-full text-center text-sm font-medium text-slate-400 hover:text-primary"
        >
          Use a different email
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-on-surface">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          placeholder="name@institution.edu"
          {...requestForm.register("email")}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition-shadow focus:border-primary focus:ring-4 focus:ring-secondary"
        />
        {requestForm.formState.errors.email && (
          <p className="mt-1.5 text-sm text-error">
            {requestForm.formState.errors.email.message}
          </p>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-error-container px-4 py-2.5 text-sm text-error">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-medium text-on-primary shadow-surface transition-shadow hover:shadow-raised disabled:opacity-60"
      >
        {isLoading ? "Sending code…" : "Send Reset Code"}
      </button>

      <p className="text-center text-sm text-slate-400">
        <Link href="/login/reviewer" className="font-medium text-primary hover:underline">
          Back to log in
        </Link>
      </p>
    </form>
  );
}