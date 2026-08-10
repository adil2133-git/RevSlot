import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  // Authorization header missing
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Authorization token required",
    });
  }

  // Expected format: Bearer <token>
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Invalid authorization format",
    });
  }

  try {
    // Verify JWT and get payload
    const payload = verifyAccessToken(token);
    req.user = payload;
    // Continue to the next middleware/controller
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