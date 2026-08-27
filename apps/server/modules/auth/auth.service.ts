import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";

import { eq, type InferSelectModel } from "drizzle-orm";
import { db } from "../../config/db.js";

import { reviewers } from "./reviewers.model.js";
import { admins } from "../admin/admins.model.js";

import { AppError } from "../../core/errors/AppError.js";

import type {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
  ResendVerificationInput,
  GoogleAuthInput,
} from "./auth.schema.js";
import {
  verifyRefreshToken,
} from "../../core/utils/jwt.js";

import { otpService } from "./otp.service.js";
import { emailService } from "../../services/email.service.js";
import { forgotPasswordTemplate } from "../../emails/templates/forgotPassword.js";
import { verifyEmailTemplate } from "../../emails/templates/verifyEmail.js";
import { refreshTokenService } from "./refreshToken.service.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;

if (!GOOGLE_CLIENT_ID) {
  throw new Error("GOOGLE_CLIENT_ID is not set in environment variables");
}

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);


// Common fields required for authentication
type AuthUser = Pick <
  InferSelectModel<typeof reviewers>,
  "id" |
  "name" |
  "email" |
  "passwordHash" |
  "avatarUrl" |
  "bio" |
  "isActive" |
  "emailVerified"
>;

// Common authentication logic
const createAuthResponse = async (user: AuthUser, password: string, role: "reviewer" | "admin") => {
  // Check whether account is active
  if (!user.isActive) {
    throw new AppError("Account is inactive", 403);
  }

  // Accounts created via Google have no password set — block normal login for them
  if (!user.passwordHash) {
    throw new AppError("This account uses Google Sign-In. Please log in with Google.", 400);
  }

  // Compare password
  const isPasswordValid = await bcrypt.compare(
    password,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  // Hard-block login until the email is verified via OTP — but only for
  // reviewers. Admins have no self-registration or verification-email
  // flow at all (accounts are provisioned directly, e.g. via db/seed.ts),
  // so there is nothing that could ever flip emailVerified to true for a
  // real admin account. Applying this gate to admins would just be a
  // permanent lockout, not a real security check.
  if (role === "reviewer" && !user.emailVerified) {
    throw new AppError("Please verify your email before logging in", 403);
  }

  // Create JWT payload
  const payload = {
    userId: user.id,
    role,
  };

  // Generate + store tokens (refresh token hash goes in the DB here)
  const { accessToken, refreshToken } = await refreshTokenService.issueTokenPair(payload);

  // Return safe user data
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

// Issues real session cookies without a password check — used after OTP
// email verification and Google sign-in, where identity is already
// proven a different way.
const issueSession = async (
  role: "reviewer" | "admin",
  userRow: { id: number; name: string; email: string; avatarUrl: string | null; bio: string | null },
) => {
  const payload = { userId: userRow.id, role };
  const { accessToken, refreshToken } = await refreshTokenService.issueTokenPair(payload);
  return {
    accessToken,
    refreshToken,
    user: {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role,
      avatarUrl: userRow.avatarUrl,
      bio: userRow.bio,
    },
  };
};

export const authService = {

  // Reviewer Registration — creates the account but does NOT log the
  // user in. They must verify their email via OTP (verifyEmail) first.
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

    const [newReviewer] = await db
      .insert(reviewers)
      .values({
        name: data.name,
        email: data.email,
        passwordHash,
        whatsappNumber: data.whatsappNumber,
      })
      .returning();

    if (!newReviewer) {
      throw new AppError("Failed to create reviewer account", 500);
    }

    const otpCode = await otpService.generateOtp(newReviewer.email, "email_verification");
    const { subject, html } = verifyEmailTemplate({ name: newReviewer.name, otpCode });
    await emailService.sendEmail({ to: newReviewer.email, subject, html });

    return {
      requiresVerification: true,
      email: newReviewer.email,
      message: "Account created. Check your email for a verification code.",
    };
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

  // Refresh access token using a valid refresh token
  refreshToken: async (refreshToken: string) => {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const table = payload.role === "admin" ? admins : reviewers;

    const [user] = await db
      .select()
      .from(table)
      .where(eq(table.id, payload.userId))
      .limit(1);

    if (!user || !user.isActive) {
      throw new AppError("Account not found or inactive", 401);
    }

    // Validates the token against the refresh_tokens table (not revoked,
    // not expired, hash matches) and rotates it — issuing + storing a
    // brand new pair. Throws if the token was already rotated once
    // before (reuse/theft signal) or otherwise invalid.
    return refreshTokenService.rotate(refreshToken);
  },

  // Logout — revokes this session's refresh token in the DB so it can
  // never be used again, even though the JWT signature would otherwise
  // stay valid until its natural 7-day expiry.
  logout: async (refreshToken: string | undefined) => {
    await refreshTokenService.revoke(refreshToken);
  },

  // Get current logged-in user
  getMe: async (userId: number, role: "reviewer" | "admin") => {
    const table = role === "admin" ? admins : reviewers;

    const [user] = await db
      .select()
      .from(table)
      .where(eq(table.id, userId))
      .limit(1);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
    };
  },

  // Request a password reset — sends an OTP if the email is registered.
  // Always returns the same generic message regardless of whether the
  // email exists, so this endpoint can't be used to enumerate accounts.
  forgotPassword: async (data: ForgotPasswordInput) => {
    const [reviewer] = await db
      .select()
      .from(reviewers)
      .where(eq(reviewers.email, data.email))
      .limit(1);

    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.email, data.email))
      .limit(1);

    const user = reviewer ?? admin;

    if (!user) {
      return { message: "If that email is registered, a reset code has been sent." };
    }

    const otpCode = await otpService.generateOtp(data.email, "forgot_password");
    const { subject, html } = forgotPasswordTemplate({ name: user.name, otpCode });
    await emailService.sendEmail({ to: data.email, subject, html });

    return { message: "If that email is registered, a reset code has been sent." };
  },

  // Verify the OTP and set a new password, for whichever table (reviewer
  // or admin) the email belongs to.
  resetPassword: async (data: ResetPasswordInput) => {
    const isValid = await otpService.verifyOtp(data.email, "forgot_password", data.otp);

    if (!isValid) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 12);

    const [reviewer] = await db
      .select()
      .from(reviewers)
      .where(eq(reviewers.email, data.email))
      .limit(1);

    if (reviewer) {
      await db
        .update(reviewers)
        .set({ passwordHash })
        .where(eq(reviewers.id, reviewer.id));
      return { message: "Password reset successful" };
    }

    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.email, data.email))
      .limit(1);

    if (admin) {
      await db
        .update(admins)
        .set({ passwordHash })
        .where(eq(admins.id, admin.id));
      return { message: "Password reset successful" };
    }

    throw new AppError("User not found", 404);
  },

  // Verify the OTP sent at registration. On success, marks the email
  // verified AND logs the user in (issues real session cookies) — this
  // is the first moment a freshly registered reviewer gets a real session.
  verifyEmail: async (data: VerifyEmailInput) => {
    const isValid = await otpService.verifyOtp(data.email, "email_verification", data.otp);

    if (!isValid) {
      throw new AppError("Invalid or expired verification code", 400);
    }

    const [reviewer] = await db
      .select()
      .from(reviewers)
      .where(eq(reviewers.email, data.email))
      .limit(1);

    if (!reviewer) {
      throw new AppError("User not found", 404);
    }

    const [updated] = await db
      .update(reviewers)
      .set({ emailVerified: true })
      .where(eq(reviewers.id, reviewer.id))
      .returning();

    if (!updated) {
      throw new AppError("Failed to verify email", 500);
    }

    return await issueSession("reviewer", updated);
  },

  // Resend a fresh OTP — for when the first one expired or got lost.
  // Always returns the same generic message regardless of whether the
  // email exists or is already verified.
  resendVerification: async (data: ResendVerificationInput) => {
    const [reviewer] = await db
      .select()
      .from(reviewers)
      .where(eq(reviewers.email, data.email))
      .limit(1);

    if (!reviewer) {
      return { message: "If that email is registered and unverified, a new code has been sent." };
    }

    if (reviewer.emailVerified) {
      return { message: "This email is already verified." };
    }

    const otpCode = await otpService.generateOtp(reviewer.email, "email_verification");
    const { subject, html } = verifyEmailTemplate({ name: reviewer.name, otpCode });
    await emailService.sendEmail({ to: reviewer.email, subject, html });

    return { message: "If that email is registered and unverified, a new code has been sent." };
  },

  // Sign in or sign up a reviewer using a Google-issued ID token.
  // Google-verified emails are trusted immediately — no OTP step needed.
  googleAuth: async (data: GoogleAuthInput) => {
    // Verify the token actually came from Google and is meant for our app
    const ticket = await googleClient.verifyIdToken({
      idToken: data.idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const googlePayload = ticket.getPayload();
    if (!googlePayload || !googlePayload.email) {
      throw new AppError("Invalid Google token", 401);
    }

    const { email, name, sub: googleId, picture } = googlePayload;

    // Check if this Google account is already linked
    let [reviewer] = await db
      .select()
      .from(reviewers)
      .where(eq(reviewers.googleId, googleId))
      .limit(1);

    if (!reviewer) {
      // Check if the email is already registered a different way (password signup)
      const [existingByEmail] = await db
        .select()
        .from(reviewers)
        .where(eq(reviewers.email, email))
        .limit(1);

      if (existingByEmail) {
        // Link this Google account to their existing password-based account
        [reviewer] = await db
          .update(reviewers)
          .set({ googleId, emailVerified: true })
          .where(eq(reviewers.id, existingByEmail.id))
          .returning();
      } else {
        // Genuinely new user — need a WhatsApp number to create the account
        if (!data.whatsappNumber) {
          throw new AppError("WhatsApp number is required for new account registration", 422);
        }

        [reviewer] = await db
          .insert(reviewers)
          .values({
            name: name ?? "Reviewer",
            email,
            googleId,
            avatarUrl: picture,
            whatsappNumber: data.whatsappNumber,
            emailVerified: true, // Google already verified this email
          })
          .returning();
      }
    }

    if (!reviewer) {
      throw new AppError("Failed to authenticate with Google", 500);
    }

    if (!reviewer.isActive) {
      throw new AppError("Account is inactive", 403);
    }

    return await issueSession("reviewer", reviewer);
  },
};