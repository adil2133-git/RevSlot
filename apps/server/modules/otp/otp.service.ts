// modules/otp/otp.service.ts
import otpGenerator from "otp-generator";
import { redis } from "../../config/redis.js";

const OTP_TTL_SECONDS = 600; // 10 minutes

export const otpService = {
  generateOtp: async (email: string, purpose: string): Promise<string> => {
    const code = otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const key = `otp:${purpose}:${email}`;
    await redis.set(key, code, { ex: OTP_TTL_SECONDS });

    console.log(`\n========================================\n[OTP] Generated code: ${code}\n[OTP] For: ${email}\n[OTP] Purpose: ${purpose}\n========================================\n`);

    return code;
  },

  verifyOtp: async (email: string, purpose: string, code: string): Promise<boolean> => {
    const key = `otp:${purpose}:${email}`;
    const stored = await redis.get<string>(key);

    if (!stored || stored !== code) return false;

    await redis.del(key); // one-time use
    return true;
  },
};