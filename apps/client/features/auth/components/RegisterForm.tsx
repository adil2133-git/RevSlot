"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { registerSchema, type RegisterFormValues } from "../validation/authSchema";
import { useAuthStore } from "../store/authStore";
import GoogleSignInButton from "./GoogleSignInButton";

export default function RegisterForm() {
  const router = useRouter();
  const { register: registerReviewer, isLoading, error } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, formState: { errors },} = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      // confirmPassword is client-only validation — RegisterSchema on the
      // backend doesn't accept/expect it.
      const { confirmPassword, ...payload } = values;
      void confirmPassword;
      await registerReviewer(payload);
      // No session yet — the store just recorded pendingVerificationEmail.
      // The user has to enter the OTP we just emailed them before they
      // get real cookies and can reach the dashboard.
      // replace (not push): the account is already created, so Back
      // shouldn't return to a resubmittable register form.
      router.replace("/verify-email");
    } catch {
      // error already captured in store; surfaced below
    }
  };

  return (
    <div>
      <GoogleSignInButton />
      <div className="my-2.5 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-[10px] font-semibold tracking-wider text-slate-400">OR</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
        <div>
          <label htmlFor="name" className="mb-0.5 block text-xs font-semibold text-slate-600">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Jane Doe"
            {...register("name")}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/40 px-3.5 py-1.5 text-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary focus:bg-white focus:ring-3 focus:ring-secondary/50"
          />
          {errors.name && <p className="mt-0.5 text-xs text-error">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="mb-0.5 block text-xs font-semibold text-slate-600">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            placeholder="name@institution.edu"
            {...register("email")}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/40 px-3.5 py-1.5 text-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary focus:bg-white focus:ring-3 focus:ring-secondary/50"
          />
          {errors.email && <p className="mt-0.5 text-xs text-error">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="username" className="mb-0.5 block text-xs font-semibold text-slate-600">
            Username
          </label>
          <input
            id="username"
            type="text"
            placeholder="john-thomas"
            autoCapitalize="none"
            {...register("username")}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/40 px-3.5 py-1.5 text-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary focus:bg-white focus:ring-3 focus:ring-secondary/50"
          />
          <p className="mt-0.5 text-[10.5px] text-slate-400">
            Your public booking link: revslot.com/{"{username}"}
          </p>
          {errors.username && <p className="mt-0.5 text-xs text-error">{errors.username.message}</p>}
        </div>

        <div>
          <label htmlFor="whatsappNumber" className="mb-0.5 block text-xs font-semibold text-slate-600">
            WhatsApp Number
          </label>
          <input
            id="whatsappNumber"
            type="tel"
            placeholder="+91 98765 43210"
            maxLength={15}
            {...register("whatsappNumber")}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/40 px-3.5 py-1.5 text-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary focus:bg-white focus:ring-3 focus:ring-secondary/50"
          />
          {errors.whatsappNumber && (
            <p className="mt-0.5 text-xs text-error">{errors.whatsappNumber.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="password" className="mb-0.5 block text-xs font-semibold text-slate-600">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/40 pl-3.5 pr-8 py-1.5 text-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary focus:bg-white focus:ring-3 focus:ring-secondary/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3 3m-3-3-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-0.5 text-xs text-error">{errors.password.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="mb-0.5 block text-xs font-semibold text-slate-600">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("confirmPassword")}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/40 pl-3.5 pr-8 py-1.5 text-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary focus:bg-white focus:ring-3 focus:ring-secondary/50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3 3m-3-3-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-0.5 text-xs text-error">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-error-container px-3 py-1.5 text-xs text-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-semibold text-on-primary shadow-surface transition-all duration-200 hover:bg-primary/95 hover:shadow-raised hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
        >
          {isLoading ? "Creating account…" : "Create Account"}
          {!isLoading && <span className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden>→</span>}
        </button>

        <p className="pt-1 text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link href="/reviewer/login" className="font-semibold text-primary transition-colors hover:text-primary/80 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}