import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import multer from 'multer';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.status(404);
  next(new Error(`Route not found - ${req.originalUrl}`));
};

export const errorMiddleware = (err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : res.statusCode !== 200 ? res.statusCode : 500;

  if (err instanceof multer.MulterError) {
    res.status(400).json({ status: "fail", message: err.message });
    return;
  }

  if (!isAppError) {
    console.error('[UNEXPECTED ERROR]', err);
  }

  res.status(statusCode).json({
    status: isAppError ? err.status : 'error',
    message: err.message || 'Something went wrong',
    ...(isAppError && err.details ? { details: err.details } : {}), // ← new
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};