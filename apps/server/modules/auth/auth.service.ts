import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";

import { AppError } from "../../core/errors/AppError.js";

import type {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
  ResendVerificationInput,
  GoogleAuthInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from "./auth.validation.js";
import {
  verifyRefreshToken,
} from "../../core/utils/jwt.js";

import { otpService } from "./otp.service.js";
import { emailService } from "../../services/email.service.js";
import { forgotPasswordTemplate, forgotPasswordTemplateData } from "../../emails/templates/forgotPassword.js";
import { verifyEmailTemplate, verifyEmailTemplateData } from "../../emails/templates/verifyEmail.js";
import { refreshTokenService } from "./refreshToken.service.js";
import { cloudinary } from "../../config/cloudinary.js";
import {
  findReviewerByEmailRepo,
  findReviewerByGoogleIdRepo,
  findReviewerByUsernameRepo,
  insertReviewerRepo,
  verifyReviewerEmailRepo,
  linkReviewerGoogleAccountRepo,
  findAdminByEmailRepo,
  findUserByIdAndRoleRepo,
  updateUserProfileRepo,
  updateUserAvatarRepo,
  updateUserPasswordRepo,
  updateReviewerPasswordRepo,
  updateAdminPasswordRepo,
} from "./auth.repository.js";
import { connectGoogleCalendarRepo } from "../calendar/calendar.repository.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;

if (!GOOGLE_CLIENT_ID) {
  throw new Error("GOOGLE_CLIENT_ID is not set in environment variables");
}

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const GOOGLE_CALENDAR_EVENTS_SCOPE = "https://www.googleapis.com/auth/calendar.events";

// Common fields required for authentication
type AuthUser = {
  id: number;
  name: string;
  email: string;
  passwordHash: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isActive: boolean | null;
  emailVerified: boolean;
  username?: string | null;
};

// Common authentication logic
const createAuthResponse = async (user: AuthUser, password: string, role: "reviewer" | "admin") => {
  // Check whether account is active
  if (!user.isActive) {
    throw new AppError("Your account has been deactivated. Please contact support.", 403);
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
    throw new AppError("Incorrect email or password. Please try again.", 401);
  }

  // Hard-block login until the email is verified via OTP — but only for
  // reviewers. Admins have no self-registration or verification-email
  // flow at all (accounts are provisioned directly, e.g. via db/seed.ts),
  // so there is nothing that could ever flip emailVerified to true for a
  // real admin account. Applying this gate to admins would just be a
  // permanent lockout, not a real security check.
  //
  // `details` carries the email back to the client so the frontend can
  // route straight to /verify-email even when it has no other record of
  // this account (e.g. the user closed the tab after registering and
  // lost the in-memory pendingVerificationEmail, then came back and
  // tried to log in instead of registering again).
  if (role === "reviewer" && !user.emailVerified) {
    throw new AppError("Please verify your email before logging in", 403, {
      requiresVerification: true,
      email: user.email,
    });
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
      username: user.username ?? null,
      email: user.email,
      role,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      whatsappNumber: ("whatsappNumber" in user ? user.whatsappNumber : null) ?? null,
    },
  };
};

// Issues real session cookies without a password check — used after OTP
// email verification and Google sign-in, where identity is already
// proven a different way.
const issueSession = async (
  role: "reviewer" | "admin",
  userRow: {
    id: number;
    name: string;
    username?: string | null;
    email: string;
    avatarUrl: string | null;
    bio: string | null;
    whatsappNumber?: string | null;
  },
) => {
  const payload = { userId: userRow.id, role };
  const { accessToken, refreshToken } = await refreshTokenService.issueTokenPair(payload);
  return {
    accessToken,
    refreshToken,
    user: {
      id: userRow.id,
      name: userRow.name,
      username: userRow.username ?? null,
      email: userRow.email,
      role,
      avatarUrl: userRow.avatarUrl,
      bio: userRow.bio,
      whatsappNumber: userRow.whatsappNumber ?? null,
    },
  };
};

async function generateUniqueUsername(name: string, email: string): Promise<string> {
  // 1. Derive base from name
  let base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Fallback to email prefix if base is empty or too short (< 3 chars)
  if (!base || base.length < 3) {
    const emailPrefix = email.split("@")[0] || "";
    base = emailPrefix
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // Fallback to "reviewer" if still invalid or too short
  if (!base || base.length < 3) {
    base = "reviewer";
  }

  // Cap base length to 22 chars so we have room for random suffix up to 30 chars
  if (base.length > 22) {
    base = base.slice(0, 22).replace(/-+$/, "");
    if (base.length < 3) {
      base = "reviewer";
    }
  }

  // Check if base is available
  const existing = await findReviewerByUsernameRepo(base);

  if (!existing) {
    return base;
  }

  // If collision, generate random suffix
  for (let i = 0; i < 10; i++) {
    const suffix = Math.floor(100 + Math.random() * 900); // 3 digits
    const candidate = `${base.slice(0, 26).replace(/-+$/, "")}-${suffix}`;
    const found = await findReviewerByUsernameRepo(candidate);

    if (!found) {
      return candidate;
    }
  }

  // Fallback with timestamp suffix
  const timestampSuffix = Date.now().toString().slice(-4);
  return `${base.slice(0, 25).replace(/-+$/, "")}-${timestampSuffix}`;
}

export const authService = {

  // Reviewer Registration — creates the account but does NOT log the
  // user in. They must verify their email via OTP (verifyEmail) first.
  registerReviewer: async (data: RegisterInput) => {
    const existingReviewer = await findReviewerByEmailRepo(data.email);

    if (existingReviewer) {
      throw new AppError("An account with this email already exists. Please log in instead.", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const username = await generateUniqueUsername(data.name, data.email);

    const newReviewer = await insertReviewerRepo({
      name: data.name,
      email: data.email,
      username,
      passwordHash,
      whatsappNumber: data.whatsappNumber,
    });

    if (!newReviewer) {
      throw new AppError("Unable to create your account right now. Please try again.", 500);
    }

    const otpCode = await otpService.generateOtp(newReviewer.email, "email_verification");
    const { html: fallbackHtml } = verifyEmailTemplate({ name: newReviewer.name, otpCode });
    const { templateId, subject, variables } = verifyEmailTemplateData({ name: newReviewer.name, otpCode });
    await emailService.sendTemplateEmail({ to: newReviewer.email, templateId, subject, variables, fallbackHtml });

    return {
      requiresVerification: true,
      email: newReviewer.email,
      message: "Account created. Check your email for a verification code.",
    };
  },


  // Reviewer Login
  loginReviewer: async (data: LoginInput) => {
    const reviewer = await findReviewerByEmailRepo(data.email);

    if (!reviewer) {
      throw new AppError("Incorrect email or password. Please try again.", 401);
    }

    return createAuthResponse(
      reviewer,
      data.password,
      "reviewer",
    );
  },

  // Admin Login
  loginAdmin: async (data: LoginInput) => {
    const admin = await findAdminByEmailRepo(data.email);

    if (!admin) {
      throw new AppError("Incorrect email or password. Please try again.", 401);
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

    const user = await findUserByIdAndRoleRepo(payload.userId, payload.role);

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
    const user = await findUserByIdAndRoleRepo(userId, role);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return {
      id: user.id,
      name: user.name,
      username: ("username" in user ? user.username : null) ?? null,
      email: user.email,
      role,
      avatarUrl: user.avatarUrl,
      bio: user.bio,

      whatsappNumber:
        "whatsappNumber" in user
          ? user.whatsappNumber
          : undefined,

      professionalHeadline:
        "professionalHeadline" in user
          ? user.professionalHeadline
          : undefined,

      skills:
        "skills" in user
          ? user.skills
          : undefined,

      yearsOfExperience:
        "yearsOfExperience" in user
          ? user.yearsOfExperience
          : undefined,

      currentRole:
        "currentRole" in user
          ? user.currentRole
          : undefined,

      currentCompany:
        "currentCompany" in user
          ? user.currentCompany
          : undefined,

      degree:
        "degree" in user
          ? user.degree
          : undefined,

      university:
        "university" in user
          ? user.university
          : undefined,

      graduationYear:
        "graduationYear" in user
          ? user.graduationYear
          : undefined,

      linkedinUrl:
        "linkedinUrl" in user
          ? user.linkedinUrl
          : undefined,

      githubUrl:
        "githubUrl" in user
          ? user.githubUrl
          : undefined,

      portfolioUrl:
        "portfolioUrl" in user
          ? user.portfolioUrl
          : undefined,

      emailVerified: user.emailVerified,
      hasPassword: Boolean(user.passwordHash),
      createdAt: user.createdAt,
    };
  },

  // Updates username for a logged-in reviewer
  updateUsername: async (userId: number, role: "reviewer" | "admin", usernameInput: string) => {
    return authService.updateProfile(userId, role, { username: usernameInput });
  },

  // Updates profile fields (name / bio / whatsappNumber / username) for a logged-in
  // user. All fields optional — only what's sent in the request gets touched.
  updateProfile: async (userId: number, role: "reviewer" | "admin", input: UpdateProfileInput) => {
    if (Object.keys(input).length === 0) {
      throw new AppError("No fields to update", 400);
    }

    if (input.username !== undefined) {
      if (role !== "reviewer") {
        throw new AppError("Only reviewers can set a username", 403);
      }
      const cleanUsername = input.username.toLowerCase().trim();
      const existing = await findReviewerByUsernameRepo(cleanUsername);

      if (existing && existing.id !== userId) {
        throw new AppError("Username is already taken", 409);
      }
      input.username = cleanUsername;
    }

    const updated = await updateUserProfileRepo(userId, role, input);

    if (!updated) {
      throw new AppError("User not found", 404);
    }

    return {
      id: updated.id,
      name: updated.name,
      username: ("username" in updated ? updated.username : null) ?? null,
      email: updated.email,
      role,
      avatarUrl: updated.avatarUrl,
      bio: updated.bio,
      whatsappNumber: ("whatsappNumber" in updated ? updated.whatsappNumber : null) ?? null,
      professionalHeadline:
        "professionalHeadline" in updated
          ? updated.professionalHeadline
          : undefined,

      skills:
        "skills" in updated
          ? updated.skills
          : undefined,

      yearsOfExperience:
        "yearsOfExperience" in updated
          ? updated.yearsOfExperience
          : undefined,

      currentRole:
        "currentRole" in updated
          ? updated.currentRole
          : undefined,

      currentCompany:
        "currentCompany" in updated
          ? updated.currentCompany
          : undefined,

      degree:
        "degree" in updated
          ? updated.degree
          : undefined,

      university:
        "university" in updated
          ? updated.university
          : undefined,

      graduationYear:
        "graduationYear" in updated
          ? updated.graduationYear
          : undefined,

      linkedinUrl:
        "linkedinUrl" in updated
          ? updated.linkedinUrl
          : undefined,

      githubUrl:
        "githubUrl" in updated
          ? updated.githubUrl
          : undefined,

      portfolioUrl:
        "portfolioUrl" in updated
          ? updated.portfolioUrl
          : undefined,
      emailVerified: updated.emailVerified,
      hasPassword: updated.passwordHash !== null,
      createdAt: updated.createdAt,
    };
  },

  updateAvatar: async (userId: number, role: "reviewer" | "admin", fileBuffer: Buffer) => {
    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "revslot/avatars",
          resource_type: "image",
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
          ],
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary upload returned no result"));
            return;
          }
          resolve(result);
        }
      );
      stream.end(fileBuffer);
    });

    const updated = await updateUserAvatarRepo(userId, role, uploadResult.secure_url);

    if (!updated) {
      throw new AppError("User not found", 404);
    }

    return { avatarUrl: updated.avatarUrl };
  },

  // Changes password for a logged-in user. Requires the CURRENT password
  // (re-auth), and on success revokes every refresh token for this
  // user — every other device/tab gets logged out and must log back in
  // with the new password. Google-only accounts (no passwordHash yet)
  // are rejected here — that would be a "set password" flow, not this one.
  changePassword: async (userId: number, role: "reviewer" | "admin", input: ChangePasswordInput) => {
    const user = await findUserByIdAndRoleRepo(userId, role);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (!user.passwordHash) {
      throw new AppError("This account uses Google Sign-In and has no password to change", 400);
    }

    const isCurrentPasswordValid = await bcrypt.compare(input.currentPassword, user.passwordHash);

    if (!isCurrentPasswordValid) {
      throw new AppError("Current password is incorrect", 401);
    }

    const newPasswordHash = await bcrypt.hash(input.newPassword, 12);

    await updateUserPasswordRepo(userId, role, newPasswordHash);

    // Force re-login everywhere — a session opened with the old password
    // shouldn't silently keep working after the password changes.
    await refreshTokenService.revokeAllForUser(userId, role);

    return { message: "Password changed successfully. Please log in again." };
  },

  // Request a password reset — sends an OTP if the email is registered.
  // Always returns the same generic message regardless of whether the
  // email exists, so this endpoint can't be used to enumerate accounts.
  forgotPassword: async (data: ForgotPasswordInput) => {
    const reviewer = await findReviewerByEmailRepo(data.email);
    const admin = reviewer ? null : await findAdminByEmailRepo(data.email);
    const user = reviewer ?? admin;

    if (!user) {
      return { message: "If that email is registered, a reset code has been sent." };
    }

    const otpCode = await otpService.generateOtp(data.email, "forgot_password");
    const { html: fallbackHtml } = forgotPasswordTemplate({ name: user.name, otpCode });
    const { templateId, subject, variables } = forgotPasswordTemplateData({ name: user.name, otpCode });
    await emailService.sendTemplateEmail({ to: data.email, templateId, subject, variables, fallbackHtml });

    return { message: "If that email is registered, a reset code has been sent." };
  },

  // Verify the OTP and set a new password, for whichever table (reviewer
  // or admin) the email belongs to.
  resetPassword: async (data: ResetPasswordInput) => {
    const isValid = await otpService.verifyOtp(data.email, "forgot_password", data.otp);

    if (!isValid) {
      throw new AppError("The reset code is invalid or has expired. Please request a new code.", 400);
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 12);

    const reviewer = await findReviewerByEmailRepo(data.email);

    if (reviewer) {
      await updateReviewerPasswordRepo(reviewer.id, passwordHash);
      return { message: "Password reset successful" };
    }

    const admin = await findAdminByEmailRepo(data.email);

    if (admin) {
      await updateAdminPasswordRepo(admin.id, passwordHash);
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
      throw new AppError("The verification code is invalid or has expired. Please request a new code.", 400);
    }

    const reviewer = await findReviewerByEmailRepo(data.email);

    if (!reviewer) {
      throw new AppError("Account not found. Please register again.", 404);
    }

    const updated = await verifyReviewerEmailRepo(reviewer.id);

    if (!updated) {
      throw new AppError("Unable to verify your email right now. Please try again.", 500);
    }

    return await issueSession("reviewer", updated);
  },

  // Resend a fresh OTP — for when the first one expired or got lost.
  // Always returns the same generic message regardless of whether the
  // email exists or is already verified.
  resendVerification: async (data: ResendVerificationInput) => {
    const reviewer = await findReviewerByEmailRepo(data.email);

    if (!reviewer) {
      return { message: "If that email is registered and unverified, a new code has been sent." };
    }

    if (reviewer.emailVerified) {
      return { message: "This email is already verified." };
    }

    const otpCode = await otpService.generateOtp(reviewer.email, "email_verification");
    const { html: fallbackHtml } = verifyEmailTemplate({ name: reviewer.name, otpCode });
    const { templateId, subject, variables } = verifyEmailTemplateData({ name: reviewer.name, otpCode });
    await emailService.sendTemplateEmail({ to: reviewer.email, templateId, subject, variables, fallbackHtml });

    return { message: "If that email is registered and unverified, a new code has been sent." };
  },

   googleAuth: async (data: GoogleAuthInput) => {
    let idToken = data.idToken;
    let calendarRefreshToken: string | null = null;

    if (data.code) {
      const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
      if (!GOOGLE_CLIENT_SECRET) {
        throw new AppError("Google sign-in is not configured on the server.", 500);
      }

      // "postmessage" = Google popup code flow ku required redirect_uri
      const codeClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, "postmessage");

      const { tokens } = await codeClient.getToken(data.code).catch(() => {
        throw new AppError("Google sign-in could not be completed. Please try again.", 401);
      });

      idToken = tokens.id_token ?? undefined;

      // User Calendar checkbox ah untick pannirukkalaam, so granted scope check pannu
      const calendarGranted = tokens.scope?.includes(GOOGLE_CALENDAR_EVENTS_SCOPE) ?? false;
      if (calendarGranted && tokens.refresh_token) {
        calendarRefreshToken = tokens.refresh_token;
      }
    }

    if (!idToken) {
      throw new AppError("Google sign-in was canceled or could not be completed. Please try again.", 401);
    }

    // Verify the token actually came from Google and is meant for our app
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const googlePayload = ticket.getPayload();
    if (!googlePayload || !googlePayload.email) {
      throw new AppError("Google sign-in was canceled or could not be completed. Please try again.", 401);
    }

    const { email, name, sub: googleId, picture } = googlePayload;

    // Check if this Google account is already linked
    let reviewer = await findReviewerByGoogleIdRepo(googleId);

    if (!reviewer) {
      // Check if the email is already registered a different way (password signup)
      const existingByEmail = await findReviewerByEmailRepo(email);

      if (existingByEmail) {
        // Link this Google account to their existing password-based account
        reviewer = await linkReviewerGoogleAccountRepo(existingByEmail.id, googleId);
      } else {
        const username = await generateUniqueUsername(name ?? "reviewer", email);

        reviewer = await insertReviewerRepo({
          name: name ?? "Reviewer",
          email,
          username,
          googleId,
          avatarUrl: picture,
          whatsappNumber: data.whatsappNumber ?? null,
          emailVerified: true, // Google already verified this email
        });
      }
    }

    if (!reviewer) {
      throw new AppError("Unable to complete Google sign-in right now. Please try again.", 500);
    }

    if (!reviewer.isActive) {
      throw new AppError("Your account has been deactivated. Please contact support.", 403);
    }

    // Google Calendar auto-connect (refresh token first consent la mattum varum)
    if (calendarRefreshToken) {
      await connectGoogleCalendarRepo(reviewer.id, calendarRefreshToken, email ?? null);
    }

    return await issueSession("reviewer", reviewer);
  },
};