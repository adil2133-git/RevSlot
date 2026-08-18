import api from "@/lib/axios";
import type {
  AuthResponse,
  ForgotPasswordPayload,
  GoogleAuthPayload,
  LoginPayload,
  MessageResponse,
  RegisterPayload,
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

// Backend logs the reviewer in immediately on register (cookies set,
// user returned) — same result shape as login.
export async function registerReviewer(payload: RegisterPayload) {
  const { data } = await api.post<AuthResponse>("/auth/reviewer/register", payload);
  return data.data.user;
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

export async function verifyEmail(payload: VerifyEmailPayload) {
  const { data } = await api.post<MessageResponse>("/auth/verify-email", payload);
  return data.message;
}

// Logs the user in (cookies set) on success, same as loginReviewer.
// Throws a 422 if this is a brand-new Google user and whatsappNumber
// wasn't included — caller should catch that and prompt for it.
export async function googleAuth(payload: GoogleAuthPayload) {
  const { data } = await api.post<AuthResponse>("/auth/google", payload);
  return data.data.user;
}