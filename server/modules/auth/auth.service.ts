import bcrypt from "bcryptjs";

import { eq, type InferSelectModel } from "drizzle-orm";
import { db } from "../../config/db.js";

import { reviewers } from "../../db/schema/reviewers.js";
import { admins } from "../../db/schema/admins.js";

import { AppError } from "../../core/errors/AppError.js";

import type { LoginInput, RegisterInput } from "./auth.schema.js";
import { generateAccessToken, generateRefreshToken } from "../../core/utils/jwt.js";


// Common fields required for authentication
type AuthUser = Pick<
  InferSelectModel<typeof reviewers>,
  "id" |
  "name" |
  "email" |
  "passwordHash" |
  "avatarUrl" |
  "bio" |
  "isActive"
>;

// Common authentication logic
const createAuthResponse = async (user: AuthUser, password: string, role: "reviewer" | "admin") => {
  // Check whether account is active
  if (!user.isActive) {
    throw new AppError("Account is inactive", 403);
  }

  // Compare password
  const isPasswordValid = await bcrypt.compare(
    password,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  // 3. Create JWT payload
  const payload = {
    userId: user.id,
    role,
  };

  // 4. Generate tokens
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // 5. Return safe user data
  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
    },
  };
};

export const authService = {
  // Reviewer Registration
  registerReviewer: async (data: RegisterInput) => {
    const existingReviewer = await db
      .select()
      .from(reviewers)
      .where(eq(reviewers.email, data.email))
      .limit(1);

    if (existingReviewer.length > 0) {
      throw new AppError("Email already registered", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    await db.insert(reviewers).values({
      name: data.name,
      email: data.email,
      passwordHash,
      whatsappNumber: data.whatsappNumber,
    });
  },

  // Reviewer Login
  loginReviewer: async (data: LoginInput) => {
    const [reviewer] = await db
      .select()
      .from(reviewers)
      .where(eq(reviewers.email, data.email))
      .limit(1);

    if (!reviewer) {
      throw new AppError("Invalid email or password", 401);
    }

    return createAuthResponse(
      reviewer,
      data.password,
      "reviewer",
    );
  },

  // Admin Login
  loginAdmin: async (data: LoginInput) => {
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.email, data.email))
      .limit(1);

    if (!admin) {
      throw new AppError("Invalid email or password", 401);
    }

    return createAuthResponse(
      admin,
      data.password,
      "admin",
    );
  },
};