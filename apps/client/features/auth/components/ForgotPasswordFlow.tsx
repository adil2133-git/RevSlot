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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

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
          <div className="relative">
            <input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              placeholder="••••••••"
              {...resetForm.register("newPassword")}
              className="w-full rounded-lg border border-slate-300 pl-4 pr-10 py-2.5 text-sm outline-none transition-shadow focus:border-primary focus:ring-4 focus:ring-secondary"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
            >
              {showNewPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3 3m-3-3-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              )}
            </button>
          </div>
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
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmNewPassword ? "text" : "password"}
              placeholder="••••••••"
              {...resetForm.register("confirmPassword")}
              className="w-full rounded-lg border border-slate-300 pl-4 pr-10 py-2.5 text-sm outline-none transition-shadow focus:border-primary focus:ring-4 focus:ring-secondary"
            />
            <button
              type="button"
              onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
            >
              {showConfirmNewPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3 3m-3-3-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              )}
            </button>
          </div>
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