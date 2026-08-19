import type { Request, Response } from "express";
import { authService } from "./auth.service.js";

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;          // 15 min
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// secure + sameSite: 'none' are required together for cross-site cookies
// (Vercel frontend, AWS backend are different origins) — with 'lax' the
// browser accepts the cookie but never sends it back on XHR/fetch, which
// silently breaks auth right after deploy while working fine on localhost.
// domain: '.revslot.com' (leading dot) makes the cookie valid across both
// revslot.com (Next.js middleware reads it here) and api.revslot.com
// (where it's set) — without it, the cookie is host-only and never
// reaches the middleware running on the root domain.
const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    domain: '.revslot.com',
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    domain: '.revslot.com',
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
};

export const authController = {

 registerReviewer: async (req: Request, res: Response) => {
    const result = await authService.registerReviewer(req.body);

    // No cookies set here — the account exists but there's no session
    // yet. The user only gets logged in once they verify the OTP sent
    // to their email (see verifyEmail below).
    res.status(201).json({
      success: true,
      message: result.message,
      data: { email: result.email, requiresVerification: result.requiresVerification },
    });
  },

 loginReviewer: async (req: Request, res: Response) => {
    const result = await authService.loginReviewer(req.body);

    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json({
      success: true,
      data: { user: result.user },
    });
  },

  loginAdmin: async (req: Request, res: Response) => {
    const result = await authService.loginAdmin(req.body);

    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json({
      success: true,
      data: { user: result.user },
    });
  },

  refreshToken: async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;
    const result = await authService.refreshToken(refreshToken);

    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json({
      success: true,
      message: "Token refreshed",
    });
  },

  logout: async (req: Request, res: Response) => {
    const clearOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none' as const,
      domain: '.revslot.com',
    }
    res.clearCookie('accessToken', clearOptions);
    res.clearCookie('refreshToken', clearOptions);

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
    // session — cookies get set here now instead of at registration.
    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json({
      success: true,
      data: { user: result.user },
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

    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json({
      success: true,
      data: { user: result.user },
    });
  },
};