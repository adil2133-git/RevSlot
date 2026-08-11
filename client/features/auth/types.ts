export type UserRole = "reviewer" | "admin";

// auth.service.ts createAuthResponse() only returns these fields for
// both roles — no whatsappNumber, even for reviewers.
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

// RegisterSchema on the backend requires confirmPassword in the body —
// it's validated server-side too, not just client-side.
export type RegisterPayload = {
  name: string;
  email: string;
  whatsappNumber: string;
  password: string;
  confirmPassword: string;
};

// ---- Raw backend envelopes ----
// Every response is wrapped in { success, ... } per auth.controller.ts.
type ApiDataEnvelope<T> = { success: true; data: T };
type ApiMessageEnvelope = { success: true; message: string };

// POST /reviewer/login, POST /admin/login → { success, data: { accessToken, refreshToken, user } }
export type LoginResult = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};
export type LoginResponse = ApiDataEnvelope<LoginResult>;

// POST /reviewer/register → { success, message } — no tokens, no user.
// Backend does not log the reviewer in on registration.
export type RegisterResponse = ApiMessageEnvelope;