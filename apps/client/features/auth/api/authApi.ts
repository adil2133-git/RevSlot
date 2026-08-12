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

export async function registerReviewer(payload: RegisterPayload) {
  const { data } = await api.post<AuthResponse>("/auth/reviewer/register", payload);
  return data.data.user;
}

export async function logout() {
  await api.post<MessageResponse>("/auth/logout");
}

export async function fetchCurrentUser() {
  const { data } = await api.get<AuthResponse>("/auth/me");
  return data.data.user;
}