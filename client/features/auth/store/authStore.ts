import { create } from "zustand";
import type { AuthUser, LoginPayload, RegisterPayload } from "../types";
import {
  loginReviewer,
  loginAdmin,
  registerReviewer,
  logout as logoutApi,
  fetchCurrentUser,
} from "../api/authApi";

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;

  loginAsReviewer: (payload: LoginPayload) => Promise<void>;
  loginAsAdmin: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
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
      const { user } = await loginReviewer(payload);
      set({ user, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
      throw err;
    }
  },

  loginAsAdmin: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await loginAdmin(payload);
      set({ user, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
      throw err;
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await registerReviewer(payload);
      set({ user, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
      throw err;
    }
  },

  logout: async () => {
    await logoutApi();
    set({ user: null });
  },

  // Call once on app mount (e.g. in a root provider) to restore
  // session state from the httpOnly cookie.
  hydrate: async () => {
    try {
      const { user } = await fetchCurrentUser();
      set({ user, isHydrated: true });
    } catch {
      set({ user: null, isHydrated: true });
    }
  },
}));