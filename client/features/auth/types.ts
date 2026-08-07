export type UserRole = "reviewer" | "admin";

export type ReviewerUser = {
  id: number;
  role: "reviewer";
  name: string;
  email: string;
  whatsappNumber: string;
  avatarUrl: string | null;
  bio: string | null;
};

export type AdminUser = {
  id: number;
  role: "admin";
  name: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
};

export type AuthUser = ReviewerUser | AdminUser;

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  whatsappNumber: string;
  password: string;
};

// Backend sets the JWT as an httpOnly cookie; response body only
// carries the user profile, never the token itself.
export type AuthResponse = {
  user: AuthUser;
};