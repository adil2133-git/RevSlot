import type { Request, Response } from "express";
import { advisorAuthService } from "./advisorAuth.service.js";
import { z } from "zod";

const SendOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const VerifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Code must be 6 digits"),
});

export const advisorAuthController = {
  sendOtp: async (req: Request, res: Response) => {
    const { email } = SendOtpSchema.parse(req.body);
    const result = await advisorAuthService.sendOtp(email);
    res.status(200).json({ success: true, ...result });
  },

  verifyOtp: async (req: Request, res: Response) => {
    const { email, code } = VerifyOtpSchema.parse(req.body);
    const result = await advisorAuthService.verifyOtp(email, code);

    res.cookie("advisorToken", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ success: true, data: result });
  },
};
