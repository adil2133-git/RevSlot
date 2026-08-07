"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((state) => state.hydrate);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Prevents a flash of logged-out UI while the /auth/me check is in flight.
  // Swap this for a proper skeleton/spinner once you have one in components/ui.
  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}