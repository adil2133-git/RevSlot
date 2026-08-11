import api from "@/lib/axios";
import type {
  LoginPayload,
  LoginResponse,
  LoginResult,
  RegisterPayload,
  RegisterResponse,
} from "../types";

export async function loginReviewer(payload: LoginPayload): Promise<LoginResult> {
  const { data } = await api.post<LoginResponse>("/auth/reviewer/login", payload);
  return data.data;
}

export async function loginAdmin(payload: LoginPayload): Promise<LoginResult> {
  const { data } = await api.post<LoginResponse>("/auth/admin/login", payload);
  return data.data;
}

// Backend does not return tokens/user here — just a confirmation message.
// Caller must redirect to login, not dashboard, after this resolves.
export async function registerReviewer(payload: RegisterPayload): Promise<string> {
  const { data } = await api.post<RegisterResponse>("/auth/reviewer/register", payload);
  return data.message;
}

// NOTE: no POST /auth/logout or GET /auth/me exist on the backend yet.
// Logout and session-restore are handled client-side only for now (see
// authStore.ts) — ask Shibin to add /auth/me if you want server-verified
// session hydration instead of trusting whatever's in localStorage.