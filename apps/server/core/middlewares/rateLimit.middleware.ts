import rateLimit from "express-rate-limit";

type LimiterOptions = {
  skipSuccessfulRequests?: boolean;
};

export const createRateLimiter = (windowMs: number, max: number, message: string, options: LimiterOptions = {}) => {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  });
};

export const loginLimiter = createRateLimiter(
  15 * 60 * 1000,
  10,
  "Too many login attempts, try again later"
);

export const registerLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  50,
  "Too many registration attempts, try again later"
);
 
export const refreshLimiter = createRateLimiter(
  15 * 60 * 1000,
  20,
  "Too many refresh attempts, try again later",
  { skipSuccessfulRequests: true }
);

export const otpSendLimiter = createRateLimiter(
  10 * 60 * 1000,
  3,
  "Too many OTP requests, try again later"
);

export const otpVerifyLimiter = createRateLimiter(
  10 * 60 * 1000,
  5,
  "Too many OTP verification attempts, try again later"
);

export const slotHoldLimiter = createRateLimiter(
  10 * 60 * 1000,
  20,
  "Too many slot hold requests, try again later"
);

export const slotReleaseLimiter = createRateLimiter(
  10 * 60 * 1000,
  30,
  "Too many slot release requests, try again later"
);

export const bookingCreateLimiter = createRateLimiter(
  10 * 60 * 1000,
  10,
  "Too many booking attempts, try again later"
);

export const passwordResetLimiter = createRateLimiter(
  15 * 60 * 1000,
  5,
  "Too many password reset requests, try again later"
);

export const verificationLimiter = createRateLimiter(
  15 * 60 * 1000,
  5,
  "Too many verification requests, try again later"
);

export const googleAuthLimiter = createRateLimiter(
  15 * 60 * 1000,
  10,
  "Too many authentication attempts, try again later"
);