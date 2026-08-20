import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";

// Access token now arrives as "Authorization: Bearer <token>" — it's no
// longer a cookie, since the frontend holds it in memory and attaches
// it manually via an axios request interceptor.
const extractBearerToken = (req: Request): string | undefined => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return undefined;
  return header.slice("Bearer ".length);
};

export const requireAuth = (req: Request, res: Response, next: NextFunction
) => {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authorization token required",
    });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const requireRole = (role: "admin" | "reviewer") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.role !== role) {
      res.status(403).json({
        success: false,
        message: "Access denied",
      });
      return;
    }

    next();
  };
};

const createRoleAuthMiddleware = (role: "admin" | "reviewer") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = extractBearerToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required",
      });
    }

    try {
      const payload = verifyAccessToken(token);
      if (payload.role !== role) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
      req.user = payload;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  };
};

export const requireReviewer = createRoleAuthMiddleware("reviewer");
export const requireAdmin = createRoleAuthMiddleware("admin");