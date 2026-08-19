export type UserRole = "reviewer" | "admin";

// getMe() / createAuthResponse() on the backend — identical shape for
// both roles, no whatsappNumber returned even for reviewers.
export type AuthUser = {
  id: number;
  role: UserRole;
  name: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
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
};

// ---- Raw backend envelopes ----
// Every response is wrapped in { success, ... }. accessToken/refreshToken
// are NEVER in the body — they're set as httpOnly cookies server-side.
type ApiDataEnvelope<T> = { success: true; data: T };
type ApiMessageEnvelope = { success: true; message: string };

export type AuthResponse = ApiDataEnvelope<{ user: AuthUser }>;
export type MessageResponse = ApiMessageEnvelope;

// registerReviewer no longer logs the user in — no session, no cookies,
// just confirmation that the account exists and an OTP was sent.
export type RegisterResponse = ApiDataEnvelope<{
  email: string;
  requiresVerification: boolean;
}> & { message: string };