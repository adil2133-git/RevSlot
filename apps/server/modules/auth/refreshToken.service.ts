import crypto from "crypto";
import { eq, and, isNull } from "drizzle-orm";

import { db } from "../../config/db.js";
import { refreshTokens } from "./refreshTokens.model.js";
import { AppError } from "../../core/errors/AppError.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  type TokenPayload,
} from "../../core/utils/jwt.js";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// A just-rotated token getting reused within this window is almost always
// a harmless race — e.g. two browser tabs sharing the same httpOnly
// refresh cookie both firing /auth/refresh within milliseconds of each
// other, or React Strict Mode / dev Fast Refresh double-firing hydrate().
// Reuse past this window is a much stronger signal of actual token theft.


const REUSE_GRACE_PERIOD_MS = 10 * 1000; // 10 seconds
// SHA-256, not bcrypt: a refresh token is already a long, random,
// high-entropy string (nobody is brute-forcing it), so bcrypt's
// deliberate slowness buys nothing here. SHA-256 being deterministic is
// what actually matters — it lets a presented token be hashed and found
// with a plain indexed equality lookup, no extra id needed.
const hashToken = (rawToken: string): string =>
  crypto.createHash("sha256").update(rawToken).digest("hex");

export const refreshTokenService = {
  // Called on login, verifyEmail, and googleAuth — issues a fresh
  // access+refresh pair and records the refresh token's hash in the DB.
  issueTokenPair: async (payload: TokenPayload) => {
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const tokenHash = hashToken(refreshToken);

    await db.insert(refreshTokens).values({
      userId: payload.userId,
      role: payload.role,
      tokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });

    return { accessToken, refreshToken };
  },

  // Called on /auth/refresh. Verifies the JWT, looks up its DB row by
  // hash, and confirms it's neither revoked nor expired. On success,
  // revokes this row and issues + stores a brand new pair — rotation.
  //
  // If an already-revoked token gets presented again, that means this
  // exact refresh token was used a second time after already being
  // rotated — a strong signal it was stolen and is being replayed by
  // someone else. Every other active session for that user+role gets
  // revoked too, forcing a full re-login everywhere.
  rotate: async (rawRefreshToken: string) => {
    try {
      verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const tokenHash = hashToken(rawRefreshToken);

    const [row] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1);

    if (!row) {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    if (row.revokedAt) {
       const revokedMsAgo = Date.now() - row.revokedAt.getTime();

       if(revokedMsAgo <= REUSE_GRACE_PERIOD_MS){
          return refreshTokenService.issueTokenPair({
          userId: row.userId,
          role: row.role,
        });
       }
      await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(refreshTokens.userId, row.userId),
            eq(refreshTokens.role, row.role),
            isNull(refreshTokens.revokedAt),
          ),
        );
      throw new AppError("Session invalidated — please log in again", 401);
    }

    if (row.expiresAt < new Date()) {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, row.id));

    return refreshTokenService.issueTokenPair({
      userId: row.userId,
      role: row.role,
    });
  },

    // Called when a password changes — revokes every active session for
  // this user+role so a leaked/old access token can't survive a
  // password change. Forces re-login on all devices.
  revokeAllForUser: async (userId: number, role: "reviewer" | "admin") => {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.userId, userId),
          eq(refreshTokens.role, role),
          isNull(refreshTokens.revokedAt),
        ),
      );
  },

  // Called on logout — revokes just this one session's refresh token.
  // Silently no-ops on an already-invalid token; logout should always
  // succeed from the client's point of view.
  revoke: async (rawRefreshToken: string | undefined) => {
    if (!rawRefreshToken) return;

    try {
      verifyRefreshToken(rawRefreshToken);
    } catch {
      return;
    }

    const tokenHash = hashToken(rawRefreshToken);

    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, tokenHash));
  },
};