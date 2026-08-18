import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";

import { eq, type InferSelectModel } from "drizzle-orm";
import { db } from "../../config/db.js";

import { reviewers } from "../../db/schema/reviewers.js";
import { admins } from "../../db/schema/admins.js";

import { AppError } from "../../core/errors/AppError.js";

import type { LoginInput, RegisterInput, ForgotPasswordInput, ResetPasswordInput, VerifyEmailInput, GoogleAuthInput } from "./auth.schema.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
} from "../../core/utils/jwt.js";

import { otpService } from "../otp/otp.service.js";
import { emailService } from "../../services/email.service.js";
import { forgotPasswordTemplate } from "../../emails/templates/forgotPassword.js";
import { verifyEmailTemplate } from "../../emails/templates/verifyEmail.js";

const CLIENT_URL = process.env.CLIENT_URL as string;

if (!CLIENT_URL) {
  throw new Error("CLIENT_URL is not set in environment variables");
}

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
  "isActive"
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

  // Create JWT payload
  const payload = {
    userId: user.id,
    role,
  };

  // Generate tokens
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

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

    // Fire the verification email — registration still succeeds even if this fails,
    // so a temporary email outage doesn't block sign-up entirely.
    try {
      const verificationToken = generateEmailVerificationToken({ userId: newReviewer.id, role: "reviewer" });
      const { subject, html } = verifyEmailTemplate({
        name: newReviewer.name,
        verificationUrl: `${CLIENT_URL}/verify-email?token=${verificationToken}`,
      });
      await emailService.sendEmail({ to: newReviewer.email, subject, html });
    } catch (err) {
      console.error("Failed to send verification email:", err);
    }

    return createAuthResponse(newReviewer, data.password, "reviewer");
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

    const newPayload = { userId: user.id, role: payload.role };

    return {
      accessToken: generateAccessToken(newPayload),
      refreshToken: generateRefreshToken(newPayload),
    };
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

  // Verify a user's email using the token from the verification link.
  verifyEmail: async (data: VerifyEmailInput) => {
    let payload;
    try {
      payload = verifyEmailVerificationToken(data.token);
    } catch {
      throw new AppError("Invalid or expired verification link", 400);
    }

    const table = payload.role === "admin" ? admins : reviewers;

    const [user] = await db
      .select()
      .from(table)
      .where(eq(table.id, payload.userId))
      .limit(1);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.emailVerified) {
      return { message: "Email already verified" };
    }

    await db
      .update(table)
      .set({ emailVerified: true })
      .where(eq(table.id, payload.userId));

    return { message: "Email verified successfully" };
  },

  // Sign in or sign up a reviewer using a Google-issued ID token.
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

    const payload = { userId: reviewer.id, role: "reviewer" as const };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: reviewer.id,
        name: reviewer.name,
        email: reviewer.email,
        role: "reviewer" as const,
        avatarUrl: reviewer.avatarUrl,
        bio: reviewer.bio,
      },
    };
  },
};