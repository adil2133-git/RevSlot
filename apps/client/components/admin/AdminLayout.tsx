"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAuthStore } from "@/features/auth/store/authStore";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  // Middleware only confirms a session cookie exists, not its role — a
  // reviewer session cookie would pass it too. This is the client-side
  // backstop; the real enforcement is requireAdmin on every /api/admin
  // call, this just avoids flashing the admin shell at a non-admin.
  useEffect(() => {
    if (isHydrated && user && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [isHydrated, user, router]);

  if (isHydrated && user && user.role !== "admin") {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto px-10 py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
