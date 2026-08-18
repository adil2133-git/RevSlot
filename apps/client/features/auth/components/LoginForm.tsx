"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { loginSchema, type LoginFormValues } from "../validation/authSchema";
import { useAuthStore } from "../store/authStore";
import GoogleSignInButton from "./GoogleSignInButton";

type LoginFormProps = {
  role: "reviewer" | "admin";
};

export default function LoginForm({ role }: LoginFormProps) {
  const router = useRouter();
  const { loginAsReviewer, loginAsAdmin, isLoading, error } = useAuthStore();

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
      router.push("/dashboard");
    } catch {
      // error already captured in store; surfaced below
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