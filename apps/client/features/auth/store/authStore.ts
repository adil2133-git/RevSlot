import { create } from "zustand";
import type { AuthUser, LoginPayload, RegisterPayload } from "../types";
import {loginReviewer, loginAdmin, registerReviewer, logout as logoutApi, fetchCurrentUser} from "../api/authApi";

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  
  loginAsReviewer: (payload: LoginPayload) => Promise<void>;
  loginAsAdmin: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  /** Clears local state only — no network call. Used when axios's
   *  refresh-retry already determined the session is dead, so calling
   *  /auth/logout again would just 401 a second time. */
  logoutLocal: () => void;
  hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isHydrated: false,
  error: null,

  loginAsReviewer: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const user = await loginReviewer(payload);
      set({ user, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
      throw err;
    }
  },

  loginAsAdmin: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const user = await loginAdmin(payload);
      set({ user, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
      throw err;
    }
  },

  // Backend logs the reviewer in immediately on register (cookies set,
  // user returned) — same result shape as login.
  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const user = await registerReviewer(payload);
      set({ user, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
      throw err;
    }
  },

  // Always clears local state, even if the network call fails (e.g. the
  // session was already dead). We don't want a failed /auth/logout to
  // surface as an unhandled error — the user is logged out either way.
  logout: async () => {
    try {
      await logoutApi();
    } catch {
      // ignore — local state still clears below
    } finally {
      set({ user: null });
    }
  },

  logoutLocal: () => set({ user: null }),

  // Server-verified — calls /auth/me so an expired/invalid token is
  // caught here on load, not on the first random dashboard request.
  hydrate: async () => {
    try {
      const user = await fetchCurrentUser();
      set({ user, isHydrated: true });
    } catch {
      set({ user: null, isHydrated: true });
    }
  },
}));