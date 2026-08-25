"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/authStore";
import { onSessionExpired } from "@/lib/axios";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const hydrate = useAuthStore((state) => state.hydrate);
  const logoutLocal = useAuthStore((state) => state.logoutLocal);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const hasHydrated = useRef(false)

  useEffect(() => {
    onSessionExpired(() => {
      logoutLocal();
      if (pathnameRef.current.startsWith("/dashboard")) {
        router.push("/login/reviewer");
      }
    });
      if (!hasHydrated.current) {
    hasHydrated.current = true;
    hydrate();
  }
 }, []);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}