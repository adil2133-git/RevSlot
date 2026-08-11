import api from "@/lib/axios";
import type {
  AuthResponse,
  LoginPayload,
  MessageResponse,
  RegisterPayload,
} from "../types";

export async function loginReviewer(payload: LoginPayload) {
  const { data } = await api.post<AuthResponse>("/auth/reviewer/login", payload);
  return data.data.user;
}

export async function loginAdmin(payload: LoginPayload) {
  const { data } = await api.post<AuthResponse>("/auth/admin/login", payload);
  return data.data.user;
}

// Backend now logs the reviewer in on register — cookies are set and the
// user is returned, same as login. No separate "go log in" step needed.
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