"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((state) => state.hydrate);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // hydrate() reads localStorage synchronously (no backend /auth/me call
  // exists yet), so this only prevents a one-frame flash of logged-out UI.
  // Swap for a proper skeleton once you have one in components/ui.
  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}