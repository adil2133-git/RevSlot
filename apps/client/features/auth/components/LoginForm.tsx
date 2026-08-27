"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { loginSchema, type LoginFormValues } from "../validation/authSchema";
import { useAuthStore } from "../store/authStore";
import GoogleSignInButton from "./GoogleSignInButton";
import { ApiError } from "@/lib/axios";

type LoginFormProps = {
  role: "reviewer" | "admin";
};

export default function LoginForm({ role }: LoginFormProps) {
  const router = useRouter();
  const { loginAsReviewer, loginAsAdmin, isLoading, error } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      if (role === "admin") {
        await loginAsAdmin(values);
      } else {
        await loginAsReviewer(values);
      }
      // replace (not push): already logged in, so Back shouldn't
      // return to the login form. Admins land in the admin console,
      // reviewers in their own dashboard.
      router.replace(role === "admin" ? "/admin/dashboard" : "/dashboard");
    } catch (err) {
      // Unverified reviewer account: the store has already stashed the
      // email as pendingVerificationEmail, so /verify-email can pick up
      // right where registration left off instead of dead-ending on
      // "please verify your email" with no way back to the OTP screen.
      if (err instanceof ApiError && err.status === 403 && (err.details as { requiresVerification?: boolean } | undefined)?.requiresVerification) {
        router.replace("/verify-email");
        return;
      }
      // other errors already captured in store; surfaced below
    }
  };

  return (
    <div>
      {/* Google sign-in only makes sense for reviewers — googleAuth on the
          backend only touches the reviewers table, admins are seeded
          directly and never have a googleId to match against. */}
      {role === "reviewer" && (
        <>
          <GoogleSignInButton />
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-semibold tracking-wider text-slate-400">OR</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <div>
          <label htmlFor="email" className="mb-1 block text-[13px] font-semibold text-slate-600">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            placeholder={role === "admin" ? "admin@revslot.com" : "name@institution.edu"}
            {...register("email")}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/40 px-4 py-2 text-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary focus:bg-white focus:ring-4 focus:ring-secondary/50"
          />
          {errors.email && <p className="mt-1 text-xs text-error">{errors.email.message}</p>}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="password" className="block text-[13px] font-semibold text-slate-600">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs font-semibold text-primary transition-colors hover:text-primary/80 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("password")}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/40 pl-4 pr-10 py-2 text-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary focus:bg-white focus:ring-4 focus:ring-secondary/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
            >
              {showPassword ? (
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
          {errors.password && (
            <p className="mt-1 text-xs text-error">{errors.password.message}</p>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-error-container px-4 py-2 text-sm text-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-on-primary shadow-surface transition-all duration-200 hover:bg-primary/95 hover:shadow-raised hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {isLoading ? "Logging in…" : "Log In"}
          {!isLoading && <span aria-hidden>→</span>}
        </button>

        {role === "reviewer" && (
          <p className="text-center text-sm text-slate-400 pt-1">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary transition-colors hover:text-primary/80 hover:underline">
              Register
            </Link>
          </p>
        )}

        <div className="flex items-center justify-center gap-1 pt-1 text-center text-xs text-slate-400">
          <span aria-hidden>🔒</span> Secure Access
        </div>
      </form>
    </div>
  );
}