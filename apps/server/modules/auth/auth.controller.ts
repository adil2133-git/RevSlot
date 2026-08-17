import type { Request, Response } from "express";
import { authService } from "./auth.service.js";

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;          // 15 min
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
};

export const authController = {

 registerReviewer: async (req: Request, res: Response) => {
    const result = await authService.registerReviewer(req.body);

    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(201).json({
      success: true,
      data: { user: result.user },
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
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

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
};