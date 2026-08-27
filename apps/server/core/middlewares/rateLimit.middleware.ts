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
