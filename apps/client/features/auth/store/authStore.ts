import { create } from "zustand";

import type {
  AuthUser,
  ForgotPasswordPayload,
  GoogleAuthPayload,
  LoginPayload,
  RegisterPayload,
  ResendVerificationPayload,
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
  resendVerification as resendVerificationApi,
  googleAuth as googleAuthApi,
} from "../api/authApi";

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  // Set right after a successful register — the email awaiting OTP
  // verification. Read by the verify-email screen so it doesn't need
  // the email passed through the URL/router state.
  pendingVerificationEmail: string | null;

  loginAsReviewer: (payload: LoginPayload) => Promise<void>;
  loginAsAdmin: (payload: LoginPayload) => Promise<void>;
  /** No longer logs the user in — creates the account and sends an OTP.
   *  Sets `pendingVerificationEmail` on success; caller should route to
   *  the OTP entry screen, not the dashboard. */
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  logoutLocal: () => void;
  hydrate: () => Promise<void>;

  forgotPassword: (payload: ForgotPasswordPayload) => Promise<string>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<string>;
  /** Verifies the OTP from registration and logs the user in — this is
   *  the first point a freshly registered reviewer gets a real session. */
  verifyEmail: (payload: VerifyEmailPayload) => Promise<void>;
  resendVerification: (payload: ResendVerificationPayload) => Promise<string>;
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
  pendingVerificationEmail: null,

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
      const { email } = await registerReviewer(payload);
      // No `user` set here — no session exists yet. Just remember which
      // email is pending verification for the next screen.
      set({ pendingVerificationEmail: email, isLoading: false });
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
      const user = await verifyEmailApi(payload);
      // This is where a freshly registered user actually gets a session.
      set({ user, isLoading: false, pendingVerificationEmail: null });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
      throw err;
    }
  },

  resendVerification: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const message = await resendVerificationApi(payload);
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