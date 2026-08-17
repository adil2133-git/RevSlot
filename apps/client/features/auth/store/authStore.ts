import { create } from "zustand";
import type {
  AuthUser,
  ForgotPasswordPayload,
  GoogleAuthPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  VerifyEmailPayload,
} from "../types";
import {
  loginReviewer,
  loginAdmin,
  registerReviewer,
  logout as logoutApi,
  fetchCurrentUser,
  forgotPassword as forgotPasswordApi,
  resetPassword as resetPasswordApi,
  verifyEmail as verifyEmailApi,
  googleAuth as googleAuthApi,
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
  logoutLocal: () => void;
  hydrate: () => Promise<void>;

  forgotPassword: (payload: ForgotPasswordPayload) => Promise<string>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<string>;
  verifyEmail: (payload: VerifyEmailPayload) => Promise<string>;
  /** Logs the user in on success, same as a normal login. Throws (with
   *  `.status === 422`) if this is a new Google user and whatsappNumber
   *  wasn't supplied — caller should catch that and re-call with it. */
  googleAuth: (payload: GoogleAuthPayload) => Promise<void>;
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

  hydrate: async () => {
    try {
      const user = await fetchCurrentUser();
      set({ user, isHydrated: true });
    } catch {
      set({ user: null, isHydrated: true });
    }
  },

  forgotPassword: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const message = await forgotPasswordApi(payload);
      set({ isLoading: false });
      return message;
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
      throw err;
    }
  },

  resetPassword: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const message = await resetPasswordApi(payload);
      set({ isLoading: false });
      return message;
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
      throw err;
    }
  },

  verifyEmail: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const message = await verifyEmailApi(payload);
      set({ isLoading: false });
      return message;
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
      throw err;
    }
  },

  googleAuth: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const user = await googleAuthApi(payload);
      set({ user, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
      throw err;
    }
  },
}));