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
// backend dropped that field; it's now purely client-side validation
// (see authSchema.ts), stripped before the request is sent.
export type RegisterPayload = {
  name: string;
  email: string;
  whatsappNumber: string;
  password: string;
};

// ---- Raw backend envelopes ----
// Every response is wrapped in { success, ... }. accessToken/refreshToken
// are NEVER in the body — they're set as httpOnly cookies server-side.
type ApiDataEnvelope<T> = { success: true; data: T };
type ApiMessageEnvelope = { success: true; message: string };

export type AuthResponse = ApiDataEnvelope<{ user: AuthUser }>;
export type MessageResponse = ApiMessageEnvelope;