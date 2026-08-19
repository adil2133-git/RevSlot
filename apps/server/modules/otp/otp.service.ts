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
    const stored = await redis.get<string | number>(key);

    // Upstash's client auto-JSON-parses values that look like valid JSON —
    // a pure-digit string like "176550" is valid JSON (a number literal),
    // so it comes back as the number 176550, not the string "176550".
    // Without String(...) here, `stored !== code` fails on every single
    // OTP check regardless of whether the code is actually correct.
    if (!stored || String(stored) !== code) return false;

    await redis.del(key); // one-time use
    return true;
  },
};