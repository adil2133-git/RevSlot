import { create } from "zustand";
import type { AuthUser, LoginPayload, RegisterPayload } from "../types";
import { loginReviewer, loginAdmin, registerReviewer } from "../api/authApi";
import { setAuthToken } from "@/lib/axios";
import { setCookie, deleteCookie } from "@/lib/cookies";

const STORAGE_KEY = "revslot_auth";
const COOKIE_NAME = "revslot_access_token"; // read by middleware.ts — presence-only check

type Persisted = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

function persist(data: Persisted) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  // Non-httpOnly on purpose: middleware.ts runs on the Edge runtime and
  // can't read localStorage, only cookies. This cookie never carries the
  // real token value's security weight — the Authorization header (set via
  // setAuthToken) is what the backend actually trusts.
  setCookie(COOKIE_NAME, "1");
}

function clearPersisted() {
  localStorage.removeItem(STORAGE_KEY);
  deleteCookie(COOKIE_NAME);
}

function readPersisted(): Persisted | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Persisted;
  } catch {
    return null;
  }
}

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;

  loginAsReviewer: (payload: LoginPayload) => Promise<void>;
  loginAsAdmin: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<string>;
  logout: () => void;
  hydrate: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: false,
  isHydrated: false,
  error: null,

  loginAsReviewer: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const result = await loginReviewer(payload);
      persist(result);
      setAuthToken(result.accessToken);
      set({ user: result.user, accessToken: result.accessToken, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
      throw err;
    }
  },

  loginAsAdmin: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const result = await loginAdmin(payload);
      persist(result);
      setAuthToken(result.accessToken);
      set({ user: result.user, accessToken: result.accessToken, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
      throw err;
    }
  },

  // Returns the backend's confirmation message. Does NOT log the user in —
  // backend issues no token on registration, so there's nothing to persist.
  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const message = await registerReviewer(payload);
      set({ isLoading: false });
      return message;
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
      throw err;
    }
  },

  // Local-only — no backend /auth/logout endpoint exists yet.
  logout: () => {
    clearPersisted();
    setAuthToken(null);
    set({ user: null, accessToken: null });
  },

  // Restores session from localStorage on app mount. This trusts the
  // stored token without server verification (no /auth/me endpoint to
  // check against yet) — an expired/invalid token will just 401 on the
  // first real API call rather than being caught here.
  hydrate: () => {
    const persisted = readPersisted();
    if (persisted) {
      setAuthToken(persisted.accessToken);
      set({
        user: persisted.user,
        accessToken: persisted.accessToken,
        isHydrated: true,
      });
    } else {
      set({ isHydrated: true });
    }
  },
}));