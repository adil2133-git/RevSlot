"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { registerSchema, type RegisterFormValues } from "../validation/authSchema";
import { useAuthStore } from "../store/authStore";

export default function RegisterForm() {
  const router = useRouter();
  const { register: registerReviewer, isLoading, error } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const { confirmPassword, ...payload } = values;
      void confirmPassword;
      await registerReviewer(payload);
      router.push("/dashboard");
    } catch {
      // error already captured in store; surfaced below
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-on-surface">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          placeholder="Jane Doe"
          {...register("name")}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition-shadow focus:border-primary focus:ring-4 focus:ring-secondary"
        />
        {errors.name && <p className="mt-1.5 text-sm text-error">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-on-surface">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          placeholder="name@institution.edu"
          {...register("email")}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition-shadow focus:border-primary focus:ring-4 focus:ring-secondary"
        />
        {errors.email && <p className="mt-1.5 text-sm text-error">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="whatsappNumber" className="mb-1.5 block text-sm font-medium text-on-surface">
          WhatsApp Number
        </label>
        <input
          id="whatsappNumber"
          type="tel"
          placeholder="+91 98765 43210"
          {...register("whatsappNumber")}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition-shadow focus:border-primary focus:ring-4 focus:ring-secondary"
        />
        {errors.whatsappNumber && (
          <p className="mt-1.5 text-sm text-error">{errors.whatsappNumber.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-on-surface">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register("password")}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition-shadow focus:border-primary focus:ring-4 focus:ring-secondary"
          />
          {errors.password && (
            <p className="mt-1.5 text-sm text-error">{errors.password.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-on-surface">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            {...register("confirmPassword")}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition-shadow focus:border-primary focus:ring-4 focus:ring-secondary"
          />
          {errors.confirmPassword && (
            <p className="mt-1.5 text-sm text-error">{errors.confirmPassword.message}</p>
          )}
        </div>
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
        {isLoading ? "Creating account…" : "Create Account"}
        {!isLoading && <span aria-hidden>→</span>}
      </button>

      <p className="text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/login/reviewer" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}