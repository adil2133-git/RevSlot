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
  UpdateProfilePayload,
  ChangePasswordPayload,
} from "../types";
import {
  loginReviewer,
  loginAdmin,
  registerReviewer,
  logout as logoutApi,
  getMe,
  forgotPassword as forgotPasswordApi,
  resetPassword as resetPasswordApi,
  verifyEmail as verifyEmailApi,
  resendVerification as resendVerificationApi,
  googleAuth as googleAuthApi,
  updateUsername as updateUsernameApi,
  updateProfile as updateProfileApi,
  changePassword as changePasswordApi,
} from "../api/authApi";
import { setAccessToken, refreshAccessToken, ApiError } from "@/lib/axios";

// Shape of the `details` the backend attaches to the 403 thrown by
// createAuthResponse() when a reviewer logs in before verifying their
// email (see auth.service.ts). Narrowed with a type guard since
// ApiError.details comes in as `unknown`.
type RequiresVerificationDetails = { requiresVerification: true; email: string };

function isRequiresVerificationDetails(
  details: unknown
): details is RequiresVerificationDetails {
  return (
    typeof details === "object" &&
    details !== null &&
    (details as Record<string, unknown>).requiresVerification === true &&
    typeof (details as Record<string, unknown>).email === "string"
  );
}

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
  /** Re-establishes a session on app load: gets a fresh access token
   *  using the httpOnly refresh cookie, then fetches the user profile
   *  with that token. Two round trips, on purpose — there's no way to
   *  get both in one call with the current backend shape. */
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
  updateUsername: (username: string) => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  /** Changes password server-side and revokes ALL sessions (including
   *  this one) — clears local auth state too, same as logout. Caller
   *  should redirect to login after this resolves. */
  changePassword: (payload: ChangePasswordPayload) => Promise<string>;
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
      const { user, accessToken } = await loginReviewer(payload);
      setAccessToken(accessToken);
      set({ user, isLoading: false });
    } catch (err) {
      // Unverified account — the backend confirms it exists and sends
      // the email back in `details`. Populate pendingVerificationEmail
      // from that (not from a prior register() call, which may never
      // have happened in this session — e.g. the user registered,
      // closed the tab before verifying, and came back to log in
      // instead) so /verify-email has what it needs. Still rethrown:
      // the caller (LoginForm) is what actually redirects there.
      if (err instanceof ApiError && err.status === 403 && isRequiresVerificationDetails(err.details)) {
        set({ isLoading: false, error: null, pendingVerificationEmail: err.details.email });
        throw err;
      }
      set({ isLoading: false, error: (err as Error).message });
      throw err;
    }
  },

  loginAsAdmin: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { user, accessToken } = await loginAdmin(payload);
      setAccessToken(accessToken);
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
      // No `user` set here, no accessToken to store — no session exists
      // yet. Just remember which email is pending verification.
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
      setAccessToken(null);
      set({ user: null });
    }
  },

  logoutLocal: () => {
    setAccessToken(null);
    set({ user: null });
  },

  hydrate: async () => {
    try {
      const accessToken = await refreshAccessToken();
      setAccessToken(accessToken);
      const user = await getMe();
      set({ user, isHydrated: true });
    } catch (err) {
      // No valid refresh cookie, or getMe failed after a refresh that
      // did succeed — either way, no session. Make sure axios doesn't
      // keep a half-set token around from a partial failure.
      if (err instanceof ApiError && err.status === 429) {
        set({ isHydrated: true });
        return;
      }

      setAccessToken(null);
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
      const { user, accessToken } = await verifyEmailApi(payload);
      // This is where a freshly registered user actually gets a session.
      setAccessToken(accessToken);
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
      const { user, accessToken } = await googleAuthApi(payload);
      setAccessToken(accessToken);
      set({ user, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
      throw err;
    }
  },

  updateUsername: async (username: string) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await updateUsernameApi(username);
      set({ user: updatedUser, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
      throw err;
    }
  },

  updateProfile: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await updateProfileApi(payload);
      set({ user: updatedUser, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
      throw err;
    }
  },

  changePassword: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const message = await changePasswordApi(payload);
      // Server revoked every session for this account — mirror that
      // locally so the UI doesn't keep acting like it's logged in.
      setAccessToken(null);
      set({ user: null, isLoading: false });
      return message;
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
      throw err;
    }
  },

}));
