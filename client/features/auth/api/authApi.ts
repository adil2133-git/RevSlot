import api from "@/lib/axios";
import type { AuthResponse, LoginPayload, RegisterPayload } from "../types";

export async function loginReviewer(payload: LoginPayload) {
  const { data } = await api.post<AuthResponse>("/auth/reviewer/login", payload);
  return data;
}

export async function loginAdmin(payload: LoginPayload) {
  const { data } = await api.post<AuthResponse>("/auth/admin/login", payload);
  return data;
}

export async function registerReviewer(payload: RegisterPayload) {
  const { data } = await api.post<AuthResponse>("/auth/reviewer/register", payload);
  return data;
}

export async function logout() {
  await api.post("/auth/logout");
}

// Called on app load to hydrate the store from the httpOnly cookie,
// since the token itself is never readable client-side.
export async function fetchCurrentUser() {
  const { data } = await api.get<AuthResponse>("/auth/me");
  return data;
}