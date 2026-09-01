import api from "@/lib/axios";

import type {
  AuthResponse,
  ForgotPasswordPayload,
  GoogleAuthPayload,
  LoginPayload,
  MeResponse,
  MessageResponse,
  RefreshResponse,
  RegisterPayload,
  RegisterResponse,
  ResendVerificationPayload,
  ResetPasswordPayload,
  VerifyEmailPayload,
  UpdateProfilePayload,
  ChangePasswordPayload,
} from "../types";

export async function loginReviewer(payload: LoginPayload) {
  const { data } = await api.post<AuthResponse>("/auth/reviewer/login", payload);
  return { user: data.data.user, accessToken: data.data.accessToken };
}

export async function loginAdmin(payload: LoginPayload) {
  const { data } = await api.post<AuthResponse>("/auth/admin/login", payload);
  return { user: data.data.user, accessToken: data.data.accessToken };
}

// No session is created here anymore — the account exists, but the user
// must verify the OTP sent to their email (see verifyEmail) before they
// get a real session. Returns the email + a confirmation message, not a user.
export async function registerReviewer(payload: RegisterPayload) {
  const { data } = await api.post<RegisterResponse>("/auth/reviewer/register", payload);
  return { email: data.data.email, message: data.message };
}

export async function logout() {
  await api.post<MessageResponse>("/auth/logout");
}

// Uses the httpOnly refresh cookie to mint a fresh access token. Returns
// ONLY the token — no user data. This is intentionally separate from
// getMe() below: on app load you need both (a valid token to attach to
// requests, THEN the actual profile), not one call doing double duty.

// Fetches the logged-in user's profile. Requires a valid access token
// already attached to the request (lib/axios.ts's interceptor handles
// this) — call AFTER refreshAccessToken() succeeds, never instead of it.
export async function getMe() {
  const { data } = await api.get<MeResponse>("/auth/me");
  return data.data.user;
}

// Always returns the same generic message whether or not the email is
// registered — backend deliberately avoids leaking account existence.
export async function forgotPassword(payload: ForgotPasswordPayload) {
  const { data } = await api.post<MessageResponse>("/auth/forgot-password", payload);
  return data.message;
}

export async function resetPassword(payload: ResetPasswordPayload) {
  const { data } = await api.post<MessageResponse>("/auth/reset-password", payload);
  return data.message;
}

// OTP-based now — {email, otp} instead of a link token. On success this
// is where the user actually gets logged in (refresh cookie set, access
// token + user returned), since registration itself no longer creates a
// session.
export async function verifyEmail(payload: VerifyEmailPayload) {
  const { data } = await api.post<AuthResponse>("/auth/verify-email", payload);
  return { user: data.data.user, accessToken: data.data.accessToken };
}

// Requests a fresh OTP, for when the first one expired or got lost.
export async function resendVerification(payload: ResendVerificationPayload) {
  const { data } = await api.post<MessageResponse>("/auth/resend-verification", payload);
  return data.message;
}

// Logs the user in (refresh cookie set, access token returned) on
// success, same as loginReviewer. Throws a 422 if this is a brand-new
// Google user and whatsappNumber wasn't included — caller should catch
// that and prompt for it.
export async function googleAuth(payload: GoogleAuthPayload) {
  const { data } = await api.post<AuthResponse>("/auth/google", payload);
  return { user: data.data.user, accessToken: data.data.accessToken };
}

export async function updateUsername(username: string) {
  const { data } = await api.patch<MeResponse>("/auth/profile/username", { username });
  return data.data.user;
}

export async function updateProfile(payload: UpdateProfilePayload) {
  const { data } = await api.patch<MeResponse>("/auth/profile", payload);
  return data.data.user;
}

export async function changePassword(payload: ChangePasswordPayload) {
  const { data } = await api.patch<MessageResponse>("/auth/profile/password", payload);
  return data.message;
}
