"use client";

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
      // Backend sets cookies + returns the user on register now, so
      // there's a real session immediately — no detour through login.
      router.push("/dashboard");
    } catch {
      // error already captured in store; surfaced below
    }
  };

  return (
    <div>
      <GoogleSignInButton />
      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-[11px] font-semibold tracking-wider text-slate-400">OR</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
      <div>
        <label htmlFor="name" className="mb-1 block text-[13px] font-semibold text-slate-600">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          placeholder="Jane Doe"
          {...register("name")}
          className="w-full rounded-lg border border-slate-200 bg-slate-50/40 px-4 py-2 text-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary focus:bg-white focus:ring-4 focus:ring-secondary/50"
        />
        {errors.name && <p className="mt-1 text-xs text-error">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-[13px] font-semibold text-slate-600">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          placeholder="name@institution.edu"
          {...register("email")}
          className="w-full rounded-lg border border-slate-200 bg-slate-50/40 px-4 py-2 text-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary focus:bg-white focus:ring-4 focus:ring-secondary/50"
        />
        {errors.email && <p className="mt-1 text-xs text-error">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="whatsappNumber" className="mb-1 block text-[13px] font-semibold text-slate-600">
          WhatsApp Number
        </label>
        <input
          id="whatsappNumber"
          type="tel"
          placeholder="+91 98765 43210"
          maxLength={15}
          {...register("whatsappNumber")}
          className="w-full rounded-lg border border-slate-200 bg-slate-50/40 px-4 py-2 text-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary focus:bg-white focus:ring-4 focus:ring-secondary/50"
        />
        {errors.whatsappNumber && (
          <p className="mt-1 text-xs text-error">{errors.whatsappNumber.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="password" className="mb-1 block text-[13px] font-semibold text-slate-600">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register("password")}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/40 px-4 py-2 text-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary focus:bg-white focus:ring-4 focus:ring-secondary/50"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-error">{errors.password.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-[13px] font-semibold text-slate-600">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            {...register("confirmPassword")}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/40 px-4 py-2 text-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary focus:bg-white focus:ring-4 focus:ring-secondary/50"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-error">{errors.confirmPassword.message}</p>
          )}
        </div>
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
        {isLoading ? "Creating account…" : "Create Account"}
        {!isLoading && <span className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden>→</span>}
      </button>

      <p className="text-center text-sm text-slate-400 pt-1">
        Already have an account?{" "}
        <Link href="/login/reviewer" className="font-semibold text-primary transition-colors hover:text-primary/80 hover:underline">
          Log in
        </Link>
      </p>
      </form>
    </div>
  );
}