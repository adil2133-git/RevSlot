import api from "@/lib/axios";

import type {
  AuthResponse,
  ForgotPasswordPayload,
  GoogleAuthPayload,
  LoginPayload,
  MessageResponse,
  RegisterPayload,
  RegisterResponse,
  ResendVerificationPayload,
  ResetPasswordPayload,
  VerifyEmailPayload,
} from "../types";

export async function loginReviewer(payload: LoginPayload) {
  const { data } = await api.post<AuthResponse>("/auth/reviewer/login", payload);
  return data.data.user;
}

export async function loginAdmin(payload: LoginPayload) {
  const { data } = await api.post<AuthResponse>("/auth/admin/login", payload);
  return data.data.user;
}

// No session is created here anymore — the account exists, but the user
// must verify the OTP sent to their email (see verifyEmail) before they
// get real cookies. Returns the email + a confirmation message, not a user.
export async function registerReviewer(payload: RegisterPayload) {
  const { data } = await api.post<RegisterResponse>("/auth/reviewer/register", payload);
  return { email: data.data.email, message: data.message };
}

export async function logout() {
  await api.post<MessageResponse>("/auth/logout");
}

// Server-verified session check — used on app load instead of trusting
// anything client-side, since the token itself is httpOnly and invisible
// to JS anyway.
export async function fetchCurrentUser() {
  const { data } = await api.get<AuthResponse>("/auth/me");
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
// is where the user actually gets logged in (cookies set, user returned),
// since registration itself no longer creates a session.
export async function verifyEmail(payload: VerifyEmailPayload) {
  const { data } = await api.post<AuthResponse>("/auth/verify-email", payload);
  return data.data.user;
}

// Requests a fresh OTP, for when the first one expired or got lost.
export async function resendVerification(payload: ResendVerificationPayload) {
  const { data } = await api.post<MessageResponse>("/auth/resend-verification", payload);
  return data.message;
}

// Logs the user in (cookies set) on success, same as loginReviewer.
// Throws a 422 if this is a brand-new Google user and whatsappNumber
// wasn't included — caller should catch that and prompt for it.
export async function googleAuth(payload: GoogleAuthPayload) {
  const { data } = await api.post<AuthResponse>("/auth/google", payload);
  return data.data.user;
}