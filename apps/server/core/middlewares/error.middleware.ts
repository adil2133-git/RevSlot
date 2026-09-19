import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import multer from 'multer';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.status(404);
  next(new Error(`Route not found - ${req.originalUrl}`));
};

type DbErrorLike = {
  code?: string;
  constraint?: string;
  detail?: string;
  table?: string;
  column?: string;
  message?: string;
};

const mapDatabaseError = (err: unknown): { statusCode: number; status: string; message: string } | null => {
  if (!err || typeof err !== 'object') return null;

  const dbErr = err as DbErrorLike;
  const code = dbErr.code;
  const constraint = (dbErr.constraint || dbErr.detail || dbErr.message || '').toLowerCase();

  // PostgreSQL Unique Violation
  if (code === '23505') {
    if (constraint.includes('email')) {
      return { statusCode: 409, status: 'fail', message: 'An account with this email already exists. Please log in instead.' };
    }
    if (constraint.includes('username')) {
      return { statusCode: 409, status: 'fail', message: 'This username is already taken. Please choose a different one.' };
    }
    if (constraint.includes('whatsapp')) {
      return { statusCode: 409, status: 'fail', message: 'This WhatsApp number is already linked to an account.' };
    }
    return { statusCode: 409, status: 'fail', message: 'An account or record with these details already exists.' };
  }

  // PostgreSQL Foreign Key Violation
  if (code === '23503') {
    return { statusCode: 400, status: 'fail', message: 'The requested resource or reference could not be found.' };
  }

  // PostgreSQL Not Null Violation
  if (code === '23502') {
    return { statusCode: 400, status: 'fail', message: 'Required information is missing. Please check your submission.' };
  }

  // PostgreSQL Invalid Format
  if (code === '22P02') {
    return { statusCode: 400, status: 'fail', message: 'Invalid data format provided.' };
  }

  // Database connection issues
  if (
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'ENOTFOUND' ||
    code === '57P01' ||
    code === '08006' ||
    code === '08001'
  ) {
    return { statusCode: 503, status: 'error', message: 'Our database service is temporarily unavailable. Please try again in a few moments.' };
  }

  return null;
};

export const errorMiddleware = (err: Error | AppError, req: Request, res: Response, _next: NextFunction) => {
  const isAppError = err instanceof AppError;

  if (err instanceof multer.MulterError) {
    res.status(400).json({ status: 'fail', message: err.message });
    return;
  }

  // Check if it's a known database error
  const dbError = mapDatabaseError(err);
  if (dbError) {
    console.warn(`[DB ERROR HANDLED] Code: ${(err as DbErrorLike).code}, Message: ${dbError.message}`);
    res.status(dbError.statusCode).json({
      status: dbError.status,
      message: dbError.message,
    });
    return;
  }

  const statusCode = isAppError ? err.statusCode : res.statusCode !== 200 ? res.statusCode : 500;

  if (!isAppError) {
    console.error('[UNEXPECTED ERROR]', err);
  }

  // Sanitize message: never leak raw SQL or database internal errors for unexpected 500 errors
  const userMessage = isAppError
    ? err.message
    : statusCode >= 500
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Something went wrong';

  res.status(statusCode).json({
    status: isAppError ? err.status : 'error',
    message: userMessage,
    ...(isAppError && err.details ? { details: err.details } : {}),
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};