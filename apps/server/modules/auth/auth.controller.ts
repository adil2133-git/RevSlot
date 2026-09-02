import type { Request, Response } from "express";
import { authService } from "./auth.service.js";

const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
const isProd = process.env.NODE_ENV === "production";

// Only the refresh token is cookied now — the access token goes in the
// JSON response body instead, and the frontend holds it in memory. This
// keeps the access token out of any cookie-based CSRF surface, while the
// refresh token stays httpOnly so client-side JS (and XSS) can never
// read it.
//
// secure + sameSite: 'none' + domain: '.revslot.com' are the correct
// PRODUCTION config — Vercel (revslot.com) and AWS (api.revslot.com) are
// different subdomains, so cross-site cookie rules apply, and the
// leading-dot domain makes the cookie valid across both. But every one
// of those three settings actively BREAKS cookies on localhost:
// secure:true blocks any cookie over plain http://, and domain:
// '.revslot.com' doesn't match 'localhost' at all — the browser just
// silently refuses to set it. Hence the isProd branch below.
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? "none" : "lax") as "none" | "lax",
  ...(isProd ? { domain: ".revslot.com" } : {}),
};

const setRefreshCookie = (res: Response, refreshToken: string) => {
  res.cookie('refreshToken', refreshToken, {
    ...REFRESH_COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
};

export const authController = {

 registerReviewer: async (req: Request, res: Response) => {
    const result = await authService.registerReviewer(req.body);

    // No session yet — the account exists but requires OTP verification
    // (see verifyEmail below) before any tokens are issued.
    res.status(201).json({
      success: true,
      message: result.message,
      data: { email: result.email, requiresVerification: result.requiresVerification },
    });
  },

 loginReviewer: async (req: Request, res: Response) => {
    const result = await authService.loginReviewer(req.body);

    setRefreshCookie(res, result.refreshToken);

    res.status(200).json({
      success: true,
      data: { user: result.user, accessToken: result.accessToken },
    });
  },

  loginAdmin: async (req: Request, res: Response) => {
    const result = await authService.loginAdmin(req.body);

    setRefreshCookie(res, result.refreshToken);

    res.status(200).json({
      success: true,
      data: { user: result.user, accessToken: result.accessToken },
    });
  },

  refreshToken: async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required",
      });
    }

    const result = await authService.refreshToken(refreshToken);

    // Rotation: the old refresh token is now revoked server-side, and
    // this new one replaces it in the cookie.
    setRefreshCookie(res, result.refreshToken);

    res.status(200).json({
      success: true,
      message: "Token refreshed",
      data: { accessToken: result.accessToken },
    });
  },

  logout: async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;

    // Revokes the DB-tracked row so this refresh token can never be
    // used again, even though its JWT signature stays valid until its
    // natural 7-day expiry.
    await authService.logout(refreshToken);

    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  },

  getMe: async (req: Request, res: Response) => {
    const result = await authService.getMe(req.user!.userId, req.user!.role);

    res.status(200).json({
      success: true,
      data: { user: result },
    });
  },

  updateUsername: async (req: Request, res: Response) => {
    const user = await authService.updateUsername(req.user!.userId, req.user!.role, req.body.username);

    res.status(200).json({
      success: true,
      message: "Username updated successfully",
      data: { user },
    });
  },

    updateProfile: async (req: Request, res: Response) => {
    const user = await authService.updateProfile(req.user!.userId, req.user!.role, req.body);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { user },
    });
  },

    updateAvatar: async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No image file provided" });
      return;
    }

    const result = await authService.updateAvatar(req.user!.userId, req.user!.role, req.file.buffer);

    res.status(200).json({
      success: true,
      message: "Avatar updated successfully",
      data: result,
    });
  },

  changePassword: async (req: Request, res: Response) => {
    const result = await authService.changePassword(req.user!.userId, req.user!.role, req.body);

    // Every session (including this one) was just revoked server-side —
    // clear this browser's cookie too so it isn't left holding a dead
    // refresh token.
    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  },

  forgotPassword: async (req: Request, res: Response) => {
    const result = await authService.forgotPassword(req.body);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  },

  resetPassword: async (req: Request, res: Response) => {
    const result = await authService.resetPassword(req.body);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  },

  verifyEmail: async (req: Request, res: Response) => {
    const result = await authService.verifyEmail(req.body);

    // This is where a freshly registered user gets their first real
    // session — the refresh cookie gets set here now instead of at
    // registration.
    setRefreshCookie(res, result.refreshToken);

    res.status(200).json({
      success: true,
      data: { user: result.user, accessToken: result.accessToken },
    });
  },

  resendVerification: async (req: Request, res: Response) => {
    const result = await authService.resendVerification(req.body);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  },

  googleAuth: async (req: Request, res: Response) => {
    const result = await authService.googleAuth(req.body);

    setRefreshCookie(res, result.refreshToken);

    res.status(200).json({
      success: true,
      data: { user: result.user, accessToken: result.accessToken },
    });
  },
};