export type UserRole = "reviewer" | "admin";

// getMe() / createAuthResponse() on the backend — identical shape for
// both roles, no whatsappNumber returned even for reviewers.
export type AuthUser = {
  id: number;
  role: UserRole;
  name: string;
  username: string | null;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  whatsappNumber: string | null;
  emailVerified: boolean;
  hasPassword: boolean;
  createdAt: string | null;
};

export type LoginPayload = {
  email: string;
  password: string;
};

// Network payload only — no confirmPassword. RegisterSchema on the
// backend doesn't accept/require it; that's client-only validation.
export type RegisterPayload = {
  name: string;
  email: string;
  username: string;
  whatsappNumber: string;
  password: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  email: string;
  otp: string;
  newPassword: string;
};

// OTP-based now, not a link token — matches ResetPasswordPayload's shape.
export type VerifyEmailPayload = {
  email: string;
  otp: string;
};

export type ResendVerificationPayload = {
  email: string;
};

// whatsappNumber is only required the first time a brand-new Google user
// signs up (backend returns 422 GoogleWhatsappRequiredError if omitted
// and no matching account exists yet).
export type GoogleAuthPayload = {
  idToken: string;
  whatsappNumber?: string;
  username?: string;
};

// ---- Raw backend envelopes ----
// Every response is wrapped in { success, ... }. The refresh token is
// NEVER in the body — it's set as an httpOnly cookie server-side. The
// access token IS in the body now (not a cookie) — the frontend holds
// it in memory (see authStore) and attaches it via an Authorization
// header (see lib/axios.ts).
type ApiDataEnvelope<T> = { success: true; data: T };
type ApiMessageEnvelope = { success: true; message: string };

export type AuthResponse = ApiDataEnvelope<{ user: AuthUser; accessToken: string }>;
export type RefreshResponse = ApiDataEnvelope<{ accessToken: string }>;
// GET /auth/me — requires a valid access token already attached; returns
// just the user, no tokens (nothing to refresh here).
export type MeResponse = ApiDataEnvelope<{ user: AuthUser }>;
export type MessageResponse = ApiMessageEnvelope;

// registerReviewer no longer logs the user in — no session, no tokens,
// just confirmation that the account exists and an OTP was sent.
// message lives inside `data` here (ApiDataEnvelope), unlike
// MessageResponse where it's top-level — matches auth.controller.ts's
// registerReviewer response shape exactly: { success, message, data }.
export type RegisterResponse = ApiDataEnvelope<{
  email: string;
  requiresVerification: boolean;
}> & { message: string };


export type UpdateProfilePayload = {
  name?: string;
  bio?: string;
  whatsappNumber?: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};