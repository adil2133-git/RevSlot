import { eq, and, isNull } from "drizzle-orm";
import { db } from "../../config/db.js";
import { reviewers } from "./reviewers.schema.js";
import { admins } from "../admin/admins.schema.js";
import { refreshTokens } from "./refreshTokens.schema.js";
import type { UpdateProfileInput } from "./auth.validation.js";

type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

// ============================================================================
// Reviewers Queries
// ============================================================================

export const findReviewerByEmailRepo = async (
  email: string,
  tx: DbOrTx = db
) => {
  const [reviewer] = await tx
    .select()
    .from(reviewers)
    .where(eq(reviewers.email, email))
    .limit(1);
  return reviewer ?? null;
};

export const findReviewerByIdRepo = async (
  id: number,
  tx: DbOrTx = db
) => {
  const [reviewer] = await tx
    .select()
    .from(reviewers)
    .where(eq(reviewers.id, id))
    .limit(1);
  return reviewer ?? null;
};

export const findReviewerByGoogleIdRepo = async (
  googleId: string,
  tx: DbOrTx = db
) => {
  const [reviewer] = await tx
    .select()
    .from(reviewers)
    .where(eq(reviewers.googleId, googleId))
    .limit(1);
  return reviewer ?? null;
};

export const findReviewerByUsernameRepo = async (
  username: string,
  tx: DbOrTx = db
) => {
  const [reviewer] = await tx
    .select()
    .from(reviewers)
    .where(eq(reviewers.username, username))
    .limit(1);
  return reviewer ?? null;
};

export const insertReviewerRepo = async (
  values: typeof reviewers.$inferInsert,
  tx: DbOrTx = db
) => {
  const [newReviewer] = await tx
    .insert(reviewers)
    .values(values)
    .returning();
  return newReviewer ?? null;
};

export const updateReviewerRepo = async (
  id: number,
  values: Partial<typeof reviewers.$inferInsert>,
  tx: DbOrTx = db
) => {
  const [updated] = await tx
    .update(reviewers)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(reviewers.id, id))
    .returning();
  return updated ?? null;
};

export const updateReviewerPasswordRepo = async (
  id: number,
  passwordHash: string,
  tx: DbOrTx = db
) => {
  return tx
    .update(reviewers)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(reviewers.id, id));
};

export const verifyReviewerEmailRepo = async (
  id: number,
  tx: DbOrTx = db
) => {
  const [updated] = await tx
    .update(reviewers)
    .set({ emailVerified: true, updatedAt: new Date() })
    .where(eq(reviewers.id, id))
    .returning();
  return updated ?? null;
};

export const linkReviewerGoogleAccountRepo = async (
  id: number,
  googleId: string,
  tx: DbOrTx = db
) => {
  const [updated] = await tx
    .update(reviewers)
    .set({ googleId, emailVerified: true, updatedAt: new Date() })
    .where(eq(reviewers.id, id))
    .returning();
  return updated ?? null;
};

// ============================================================================
// Admins Queries
// ============================================================================

export const findAdminByEmailRepo = async (
  email: string,
  tx: DbOrTx = db
) => {
  const [admin] = await tx
    .select()
    .from(admins)
    .where(eq(admins.email, email))
    .limit(1);
  return admin ?? null;
};

export const findAdminByIdRepo = async (
  id: number,
  tx: DbOrTx = db
) => {
  const [admin] = await tx
    .select()
    .from(admins)
    .where(eq(admins.id, id))
    .limit(1);
  return admin ?? null;
};

export const updateAdminPasswordRepo = async (
  id: number,
  passwordHash: string,
  tx: DbOrTx = db
) => {
  return tx
    .update(admins)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(admins.id, id));
};

// ============================================================================
// Polymorphic User (Reviewer / Admin) Queries
// ============================================================================

export const findUserByIdAndRoleRepo = async (
  userId: number,
  role: "reviewer" | "admin",
  tx: DbOrTx = db
) => {
  if (role === "admin") {
    return findAdminByIdRepo(userId, tx);
  }
  return findReviewerByIdRepo(userId, tx);
};

export const updateUserProfileRepo = async (
  userId: number,
  role: "reviewer" | "admin",
  input: UpdateProfileInput,
  tx: DbOrTx = db
) => {
  if (role === "admin") {
    const adminFields: Partial<typeof admins.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (input.name !== undefined) adminFields.name = input.name;
    if (input.bio !== undefined) adminFields.bio = input.bio;

    const [updated] = await tx
      .update(admins)
      .set(adminFields)
      .where(eq(admins.id, userId))
      .returning();
    return updated ?? null;
  }

  const [updated] = await tx
    .update(reviewers)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(reviewers.id, userId))
    .returning();
  return updated ?? null;
};

export const updateUserAvatarRepo = async (
  userId: number,
  role: "reviewer" | "admin",
  avatarUrl: string,
  tx: DbOrTx = db
) => {
  if (role === "admin") {
    const [updated] = await tx
      .update(admins)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(admins.id, userId))
      .returning();
    return updated ?? null;
  }

  const [updated] = await tx
    .update(reviewers)
    .set({ avatarUrl, updatedAt: new Date() })
    .where(eq(reviewers.id, userId))
    .returning();
  return updated ?? null;
};

export const updateUserPasswordRepo = async (
  userId: number,
  role: "reviewer" | "admin",
  passwordHash: string,
  tx: DbOrTx = db
) => {
  if (role === "admin") {
    return updateAdminPasswordRepo(userId, passwordHash, tx);
  }
  return updateReviewerPasswordRepo(userId, passwordHash, tx);
};

// ============================================================================
// Refresh Tokens Queries
// ============================================================================

export const insertRefreshTokenRepo = async (
  values: typeof refreshTokens.$inferInsert,
  tx: DbOrTx = db
) => {
  const [created] = await tx
    .insert(refreshTokens)
    .values(values)
    .returning();
  return created ?? null;
};

export const findRefreshTokenByHashRepo = async (
  tokenHash: string,
  tx: DbOrTx = db
) => {
  const [row] = await tx
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .limit(1);
  return row ?? null;
};

export const revokeRefreshTokenByIdRepo = async (
  id: number,
  tx: DbOrTx = db
) => {
  return tx
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, id));
};

export const revokeRefreshTokenByHashRepo = async (
  tokenHash: string,
  tx: DbOrTx = db
) => {
  return tx
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, tokenHash));
};

export const revokeActiveRefreshTokensForUserRepo = async (
  userId: number,
  role: "reviewer" | "admin",
  tx: DbOrTx = db
) => {
  return tx
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(refreshTokens.userId, userId),
        eq(refreshTokens.role, role),
        isNull(refreshTokens.revokedAt),
      ),
    );
};

export const authRepository = {
  findReviewerByEmail: findReviewerByEmailRepo,
  findReviewerById: findReviewerByIdRepo,
  findReviewerByGoogleId: findReviewerByGoogleIdRepo,
  findReviewerByUsername: findReviewerByUsernameRepo,
  insertReviewer: insertReviewerRepo,
  updateReviewer: updateReviewerRepo,
  updateReviewerPassword: updateReviewerPasswordRepo,
  verifyReviewerEmail: verifyReviewerEmailRepo,
  linkReviewerGoogleAccount: linkReviewerGoogleAccountRepo,
  findAdminByEmail: findAdminByEmailRepo,
  findAdminById: findAdminByIdRepo,
  updateAdminPassword: updateAdminPasswordRepo,
  findUserByIdAndRole: findUserByIdAndRoleRepo,
  updateUserProfile: updateUserProfileRepo,
  updateUserAvatar: updateUserAvatarRepo,
  updateUserPassword: updateUserPasswordRepo,
  insertRefreshToken: insertRefreshTokenRepo,
  findRefreshTokenByHash: findRefreshTokenByHashRepo,
  revokeRefreshTokenById: revokeRefreshTokenByIdRepo,
  revokeRefreshTokenByHash: revokeRefreshTokenByHashRepo,
  revokeActiveRefreshTokensForUser: revokeActiveRefreshTokensForUserRepo,
};
