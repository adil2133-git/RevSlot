import rateLimit from "express-rate-limit";

export const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
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
  "Too many refresh attempts, try again later"
);
